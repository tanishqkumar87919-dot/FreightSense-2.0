import math
from datetime import datetime
from typing import Tuple, Optional, List

from app.domain.models import (
    DryBulkVesselClassModel,
    EastCoastPortConstraintModel,
    CharterValidationRequest,
    CharterValidationResponse,
    DraftFeasibilityResult,
)


def validate_cargo_quantity(
    quantity_mt: float, vessel_class: Optional[DryBulkVesselClassModel] = None
) -> Tuple[bool, Optional[str]]:
    if not isinstance(quantity_mt, (int, float)) or math.isnan(quantity_mt) or quantity_mt <= 0:
        return False, "Cargo quantity must be a strictly positive number (> 0 MT)."
    if quantity_mt > 350000:
        return False, "Cargo parcel exceeds maximum global dry bulk vessel limits (350,000 MT)."
    if vessel_class:
        if quantity_mt > vessel_class.dwt_max * 0.95:
            return (
                False,
                f"Cargo parcel ({quantity_mt:,.0f} MT) exceeds safe intake for {vessel_class.name} "
                f"(max payload ~{vessel_class.dwt_max * 0.95:,.0f} MT).",
            )
        if quantity_mt < vessel_class.dwt_min * 0.6:
            return (
                False,
                f"Cargo parcel ({quantity_mt:,.0f} MT) is critically undersized for {vessel_class.name} "
                f"(minimum practical parcel ~{vessel_class.dwt_min * 0.6:,.0f} MT).",
            )
    return True, None


def validate_laycan(laycan_start: str, laycan_end: str) -> Tuple[bool, Optional[str], Optional[str]]:
    try:
        start_dt = datetime.strptime(laycan_start.strip(), "%Y-%m-%d").date()
    except Exception:
        return False, f'Invalid laycan start date: "{laycan_start}". Format must be YYYY-MM-DD.', None

    try:
        end_dt = datetime.strptime(laycan_end.strip(), "%Y-%m-%d").date()
    except Exception:
        return False, f'Invalid laycan end date: "{laycan_end}". Format must be YYYY-MM-DD.', None

    if start_dt > end_dt:
        return False, f"Laycan start date ({laycan_start}) cannot be after laycan end date ({laycan_end}).", None

    diff_days = (end_dt - start_dt).days
    warning = None
    if diff_days > 30:
        warning = f"Laycan window is {diff_days} days long. Standard dry bulk laycan spread is typically 5 to 14 days."
    elif diff_days == 0:
        warning = "Single-day laycan carries severe cancellation risk if vessel arrival is delayed."

    return True, None, warning


def validate_port_draft(
    vessel_draft_m: float,
    port: EastCoastPortConstraintModel,
    ukc_req_m: float = 1.0,
) -> Tuple[DraftFeasibilityResult, str]:
    effective_draft = port.max_permissible_draft_m
    ukc = effective_draft - vessel_draft_m

    if ukc >= ukc_req_m:
        msg = f"Vessel fully admissible at {port.port_name}. UKC: {ukc:.2f}m (Min required: {ukc_req_m}m)."
        res = DraftFeasibilityResult(
            vessel_draft_m=vessel_draft_m,
            max_port_draft_m=effective_draft,
            under_keel_clearance_m=round(ukc, 2),
            is_admissible=True,
            requires_lighterage=False,
            lighterage_location=None,
        )
        return res, msg

    if port.lighterage_required or port.riverine_navigation:
        msg = (
            f"Direct berthing restricted at {port.port_name} (Draft: {vessel_draft_m}m > Max: {effective_draft}m). "
            f"Lighterage required at {port.lighterage_location or 'Outer Anchorage / Sandheads'}."
        )
        res = DraftFeasibilityResult(
            vessel_draft_m=vessel_draft_m,
            max_port_draft_m=effective_draft,
            under_keel_clearance_m=round(ukc, 2),
            is_admissible=True,
            requires_lighterage=True,
            lighterage_location=port.lighterage_location,
        )
        return res, msg

    deficit = vessel_draft_m - effective_draft
    msg = (
        f"Vessel draft ({vessel_draft_m}m) exceeds {port.port_name} maximum limit ({effective_draft}m) "
        f"by {deficit:.2f}m. Port does not support lighterage for this draft deficit."
    )
    res = DraftFeasibilityResult(
        vessel_draft_m=vessel_draft_m,
        max_port_draft_m=effective_draft,
        under_keel_clearance_m=round(ukc, 2),
        is_admissible=False,
        requires_lighterage=False,
        lighterage_location=None,
    )
    return res, msg


def validate_charter_fixture(
    request: CharterValidationRequest,
    vessel_class: DryBulkVesselClassModel,
    port: EastCoastPortConstraintModel,
) -> CharterValidationResponse:
    errors: List[str] = []
    warnings: List[str] = []

    # 1. Cargo Quantity Check
    ok_qty, err_qty = validate_cargo_quantity(request.cargo_quantity_mt, vessel_class)
    if not ok_qty and err_qty:
        errors.append(err_qty)

    # 2. Laycan Check
    ok_lay, err_lay, warn_lay = validate_laycan(request.laycan_start, request.laycan_end)
    if not ok_lay and err_lay:
        errors.append(err_lay)
    elif warn_lay:
        warnings.append(warn_lay)

    # 3. Draft & Berth Feasibility Check
    if request.max_draft_tolerance_m:
        vessel_draft = request.max_draft_tolerance_m
    else:
        # Proportional estimated laden draft based on cargo load factor
        load_factor = min(1.0, max(0.4, request.cargo_quantity_mt / (vessel_class.dwt_max or 180000.0)))
        vessel_draft = round(vessel_class.typical_draft_m * (0.55 + 0.45 * load_factor), 2)

    draft_res, draft_msg = validate_port_draft(vessel_draft, port)

    if not draft_res.is_admissible:
        errors.append(draft_msg)
    elif draft_res.requires_lighterage:
        warnings.append(draft_msg)

    # 4. Vessel Class Compatibility
    if vessel_class.name not in port.allowable_vessel_classes:
        if draft_res.requires_lighterage:
            warnings.append(
                f"{vessel_class.name} is not standardly berthed at {port.port_name}. "
                f"Must utilize transshipment / lighterage protocol."
            )
        else:
            errors.append(
                f"{vessel_class.name} vessel class is prohibited at {port.port_name}. "
                f"Allowable classes: {', '.join(port.allowable_vessel_classes)}."
            )

    # 5. Demurrage & Discharge Days Calculation
    daily_discharge = port.mechanized_discharge_rate_mt_day or 20000.0
    discharge_days = round(request.cargo_quantity_mt / daily_discharge, 1)
    waiting_days = port.typical_waiting_days or 2.0
    demurrage_rate = port.average_demurrage_rate_usd_day or 25000.0
    estimated_demurrage = round(waiting_days * demurrage_rate, 0)

    return CharterValidationResponse(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings,
        draft_feasibility=draft_res,
        estimated_discharge_days=discharge_days,
        estimated_demurrage_exposure_usd=estimated_demurrage,
    )
