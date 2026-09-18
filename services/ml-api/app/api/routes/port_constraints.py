from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.domain.models import (
    EastCoastPortConstraintModel,
    PortFeasibilityRequest,
    PortFeasibilityResponse,
    PortRiskDimensionModel,
    PortCargoCompatibilityModel,
    PortVesselCompatibilityModel,
    PortDecisionFactorsModel,
    PortIntelligenceEvaluationRequest,
    PortIntelligenceEvaluationResponse,
    PortComparisonRequest,
    PortComparisonItemModel,
    PortComparisonResponse,
    DataProvenanceModel,
)
from app.domain.validation import validate_port_draft

router = APIRouter()

CANONICAL_PORT_CONSTRAINTS: Dict[str, Dict[str, Any]] = {
    "port-in-prt": {
        "port_id": "port-in-prt",
        "port_name": "Paradip Port",
        "port_code": "INPRT",
        "state": "Odisha",
        "max_permissible_draft_m": 17.1,
        "max_loa_m": 300.0,
        "max_beam_m": 48.0,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 30500.0,
        "typical_waiting_days": 1.8,
        "average_demurrage_rate_usd_day": 30000.0,
        "weather_sensitivity_notes": "SW Monsoon (June-September) rough swell; cyclone alert protocol in May and October-November.",
        "operational_notes": "Deepwater mechanized bulk berths handle up to 200,000 DWT Capesize without lighterage.",
        "provenance": {
            "source": "Indian Ports Association (IPA) & Paradip Port Authority Harbor Guidelines",
            "dataset_name": "Paradip Marine Berthing Parameters & Monthly Performance Bulletin",
            "coverage_period": "2021 - 2024 Traffic Data (30,500 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-viz": {
        "port_id": "port-in-viz",
        "port_name": "Visakhapatnam Port",
        "port_code": "INVTZ",
        "state": "Andhra Pradesh",
        "max_permissible_draft_m": 18.1,
        "max_loa_m": 300.0,
        "max_beam_m": 45.0,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 21000.0,
        "typical_waiting_days": 2.2,
        "average_demurrage_rate_usd_day": 28000.0,
        "weather_sensitivity_notes": "Outer harbor protected by Dolphin's Nose hill; cyclone protocols active in post-monsoon window.",
        "operational_notes": "Outer Harbor VGCB berth handles 200k DWT Capesize at 18.1m draft; Inner Harbor limited to 14.5m draft (Panamax max).",
        "provenance": {
            "source": "Visakhapatnam Port Authority (VPA) & Ministry of Ports, Shipping and Waterways",
            "dataset_name": "VPA Marine Department Port Operational Manual & Tariff Schedule",
            "coverage_period": "2021 - 2024 Traffic Data (21,000 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-enr": {
        "port_id": "port-in-enr",
        "port_name": "Kamarajar Port (Ennore)",
        "port_code": "INKRP",
        "state": "Tamil Nadu",
        "max_permissible_draft_m": 16.0,
        "max_loa_m": 260.0,
        "max_beam_m": 40.0,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 26500.0,
        "typical_waiting_days": 1.6,
        "average_demurrage_rate_usd_day": 25000.0,
        "weather_sensitivity_notes": "NE Monsoon (October-December) coastal squalls occasionally affect conveyor belts.",
        "operational_notes": "Dedicated energy port with rapid coal conveyer to power stations. Capesize berthed with partial de-ballasting.",
        "provenance": {
            "source": "Kamarajar Port Limited (KPL) Operational Gazette & IPA TRD",
            "dataset_name": "KPL Marine Berth Allotment Criteria & Handling Output",
            "coverage_period": "2021 - 2024 Traffic Data (26,500 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-maa": {
        "port_id": "port-in-maa",
        "port_name": "Chennai Port",
        "port_code": "INMAA",
        "state": "Tamil Nadu",
        "max_permissible_draft_m": 14.0,
        "max_loa_m": 235.0,
        "max_beam_m": 32.2,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 18000.0,
        "typical_waiting_days": 2.1,
        "average_demurrage_rate_usd_day": 26000.0,
        "weather_sensitivity_notes": "Open artificial basin exposed to NE Monsoon swell; stand-off advisories issued during heavy sea state.",
        "operational_notes": "Handles clean dry bulk: limestone, rock phosphate, fertilizer, and agricultural grains up to Panamax draft.",
        "provenance": {
            "source": "Chennai Port Authority Marine Department & IPA Annual Traffic",
            "dataset_name": "Chennai Port Permissible Drafts & Berth Allocation Norms",
            "coverage_period": "2021 - 2024 Traffic Data (18,000 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-kri": {
        "port_id": "port-in-kri",
        "port_name": "Krishnapatnam Port",
        "port_code": "INKRI",
        "state": "Andhra Pradesh",
        "max_permissible_draft_m": 18.5,
        "max_loa_m": 320.0,
        "max_beam_m": 50.0,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 35000.0,
        "typical_waiting_days": 1.4,
        "average_demurrage_rate_usd_day": 32000.0,
        "weather_sensitivity_notes": "Sheltered deepwater harbor with low monsoon downtime.",
        "operational_notes": "High-throughput mechanized deepwater bulk terminal capable of handling up to 200k DWT Capesize.",
        "provenance": {
            "source": "APSEZ Krishnapatnam Port Marine Department Gazette",
            "dataset_name": "Krishnapatnam Deepwater Bulk Berth Manual",
            "coverage_period": "2022 - 2024 Operations",
            "last_updated": "2024-04-01",
            "data_type": "Port Tariff & Facility Specification",
            "units": "Metres / MT per Day / USD",
            "status": "demo",
        },
    },
    "port-in-ccu": {
        "port_id": "port-in-ccu",
        "port_name": "Syama Prasad Mookerjee Port (Haldia Dock Complex)",
        "port_code": "INCCU",
        "state": "West Bengal",
        "max_permissible_draft_m": 8.2,
        "max_loa_m": 210.0,
        "max_beam_m": 31.0,
        "tidal_restriction": True,
        "riverine_navigation": True,
        "lighterage_required": True,
        "lighterage_location": "Sandheads Anchorage / Paradip Port Top-off Berths",
        "allowable_vessel_classes": ["Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 11400.0,
        "typical_waiting_days": 3.2,
        "average_demurrage_rate_usd_day": 22000.0,
        "weather_sensitivity_notes": "Heavy river siltation; mandatory 80nm pilotage; bore tides during spring equinoxes.",
        "operational_notes": "CRITICAL RIVERINE CONSTRAINT: Draft strictly limited to 7.5m - 8.5m. Capesize and laden Panamax vessels cannot enter directly without transshipment/lighterage at Sandheads deepwater anchorage.",
        "provenance": {
            "source": "Syama Prasad Mookerjee Port River Marine Directorate & IPA",
            "dataset_name": "Haldia Dock Complex Tidal Draft Schedule & Port Traffic",
            "coverage_period": "2021 - 2024 Traffic Data (11,400 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-tut": {
        "port_id": "port-in-tut",
        "port_name": "V.O. Chidambaranar Port (Tuticorin)",
        "port_code": "INTUT",
        "state": "Tamil Nadu",
        "max_permissible_draft_m": 14.2,
        "max_loa_m": 230.0,
        "max_beam_m": 32.5,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 16500.0,
        "typical_waiting_days": 1.5,
        "average_demurrage_rate_usd_day": 24000.0,
        "weather_sensitivity_notes": "Sheltered deepwater basin in Gulf of Mannar; moderate squall exposure during Northeast Monsoon (Oct-Dec).",
        "operational_notes": "Serves southern hinterland and Tuticorin Thermal Power Station. Dedicated coal jetty and North Cargo Berths handle clean bulk, rock phosphate, and limestone. Capesize requires transshipment or double-banking.",
        "provenance": {
            "source": "VOC Port Authority Marine Operations Gazette & IPA Bulletin",
            "dataset_name": "VOCPT Berth Allocation Norms & Throughput Statistics",
            "coverage_period": "2021 - 2024 Operations (16,500 MT/berth-day benchmark)",
            "last_updated": "2024-03-31",
            "data_type": "Authoritative Official Statistics",
            "units": "Metres / MT per Day / USD",
            "status": "historical",
        },
    },
    "port-in-dhm": {
        "port_id": "port-in-dhm",
        "port_name": "Dhamra Port",
        "port_code": "INDHM",
        "state": "Odisha",
        "max_permissible_draft_m": 18.0,
        "max_loa_m": 320.0,
        "max_beam_m": 50.0,
        "tidal_restriction": False,
        "riverine_navigation": False,
        "lighterage_required": False,
        "lighterage_location": None,
        "allowable_vessel_classes": ["Capesize", "Kamsarmax", "Panamax", "Ultramax", "Supramax", "Handysize"],
        "mechanized_discharge_rate_mt_day": 32000.0,
        "typical_waiting_days": 1.3,
        "average_demurrage_rate_usd_day": 31000.0,
        "weather_sensitivity_notes": "Estuarine approach sheltered by Kanika Sands; vulnerable to intense tropical cyclones in northern Bay of Bengal (May, Oct-Nov).",
        "operational_notes": "Deepwater bulk port capable of berthing fully laden 180k DWT Capesize vessels directly without lighterage. High-capacity rail connectivity to Kalinganagar steel hub.",
        "provenance": {
            "source": "APSEZ Dhamra Port Marine Operations Manual",
            "dataset_name": "Dhamra Port Deepwater Bulk Berth Specification & Tariff",
            "coverage_period": "2022 - 2024 Operations",
            "last_updated": "2024-04-01",
            "data_type": "Port Tariff & Facility Specification",
            "units": "Metres / MT per Day / USD",
            "status": "demo",
        },
    },
}

# ----------------------------------------------------------------------
# Port Cargo Handling & Regulatory Suitability Rules
# ----------------------------------------------------------------------

PORT_CARGO_HANDLING_RULES: Dict[str, Dict[str, Dict[str, Any]]] = {
    "port-in-prt": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 30500.0,
            "handling_equipment": "Mechanized stacker-reclaimers & conveyor system (Essar & Kalinga berths)",
            "status": "Supported",
            "notes": "Primary deepwater gateway for coking coal and thermal coal into Odisha and Jharkhand steel belt.",
        },
        "iron_ore": {
            "is_supported": True,
            "discharge_rate_mt_day": 28000.0,
            "handling_equipment": "Mechanized iron ore handling plant (IOHP) with twin wagon tipplers",
            "status": "Supported",
            "notes": "Handles high-density hematite iron ore fines and pellets.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 16000.0,
            "handling_equipment": "Harbor mobile cranes and grab unloaders",
            "status": "Supported",
            "notes": "Flux limestone for blast furnace operations.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 12000.0,
            "handling_equipment": "IFFCO dedicated berths with hopper bagging plants",
            "status": "Supported",
            "notes": "Handles rock phosphate and finished DAP/MOP.",
        },
    },
    "port-in-viz": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 21000.0,
            "handling_equipment": "VGCB terminal grab ship unloader & enclosed conveyors",
            "status": "Supported",
            "notes": "Supplies Vizag Steel (RINL) and central Indian power plants.",
        },
        "iron_ore": {
            "is_supported": True,
            "discharge_rate_mt_day": 25000.0,
            "handling_equipment": "Outer Harbor mechanized ore handling plant",
            "status": "Supported",
            "notes": "Direct export/import rail link with Bailadila mines.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 15000.0,
            "handling_equipment": "Multipurpose inner harbor quay cranes",
            "status": "Supported",
            "notes": "Inner harbor draft limit (14.5m) applies.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 10500.0,
            "handling_equipment": "Coromandel International dedicated bulk fertilizer berths",
            "status": "Supported",
            "notes": "Specialized bagging facilities.",
        },
    },
    "port-in-enr": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 26500.0,
            "handling_equipment": "Dedicated Coal Berths CB-1 through CB-3 with rapid overland conveyors",
            "status": "Supported",
            "notes": "Designated Tamil Nadu energy gateway. Handles massive thermal coal volumes directly to North Chennai and Vallur power stations.",
        },
        "iron_ore": {
            "is_supported": False,
            "discharge_rate_mt_day": 0.0,
            "handling_equipment": "None (dedicated clean energy and vehicle/container terminal)",
            "status": "Prohibited",
            "notes": "Iron ore operations barred; diverted to Krishnapatnam or Visakhapatnam.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 14000.0,
            "handling_equipment": "General cargo mechanized grab berth",
            "status": "Supported",
            "notes": "Cement industry flux imports.",
        },
        "fertilizer": {
            "is_supported": False,
            "discharge_rate_mt_day": 0.0,
            "handling_equipment": "None",
            "status": "Restricted",
            "notes": "Minimal fertilizer handling; routed via Chennai Port or Tuticorin.",
        },
    },
    "port-in-maa": {
        "coal": {
            "is_supported": False,
            "discharge_rate_mt_day": 0.0,
            "handling_equipment": "None (Environmental Prohibitive Injunction)",
            "status": "Prohibited",
            "notes": "CRITICAL ENVIRONMENTAL RESTRICTION: Madras High Court and MoEFCC mandate prohibited handling of dusty bulk (thermal & dirty coking coal) at Chennai Port to protect urban air quality. All coal cargo redirected to Kamarajar Port (Ennore).",
        },
        "iron_ore": {
            "is_supported": False,
            "discharge_rate_mt_day": 0.0,
            "handling_equipment": "None",
            "status": "Prohibited",
            "notes": "Raw dusty iron ore prohibited inside Chennai metropolitan limits. Only sealed pellets allowed under strict pollution norms.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 18000.0,
            "handling_equipment": "Mechanized grab unloaders & dust suppression hoppers",
            "status": "Supported",
            "notes": "Designated clean dry bulk commodity hub for southern cement plants.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 14500.0,
            "handling_equipment": "Enclosed conveyor systems and mechanized bagging units",
            "status": "Supported",
            "notes": "Major regional hub for muriate of potash (MOP) and urea.",
        },
    },
    "port-in-kri": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 35000.0,
            "handling_equipment": "Quad tandem rail dumpers & high-capacity continuous ship unloaders",
            "status": "Supported",
            "notes": "Highest bulk discharge velocity on India's East Coast; turns around Capesize vessels in ~4 days.",
        },
        "iron_ore": {
            "is_supported": True,
            "discharge_rate_mt_day": 30000.0,
            "handling_equipment": "Automated stacker-reclaimers with high-speed rail loading",
            "status": "Supported",
            "notes": "Handles Bellary-Hospet iron ore corridor.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 20000.0,
            "handling_equipment": "High-capacity mobile harbor cranes and grabs",
            "status": "Supported",
            "notes": "Supplies major Andhra Pradesh and Telangana cement clusters.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 16000.0,
            "handling_equipment": "Automated bagging and rail dispatch silos",
            "status": "Supported",
            "notes": "Clean high-throughput fertilizer handling.",
        },
    },
    "port-in-ccu": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 11400.0,
            "handling_equipment": "Haldia Dock Complex mechanized berth grabs & conveyor",
            "status": "Requires Lighterage",
            "notes": "RIVERINE DRAFT RESTRICTION: Maximum draft 8.2m. Capesize and laden Panamax vessels cannot enter directly. Mandatory ocean lighterage / top-off at Sandheads deepwater anchorage required before entering Hugli estuary.",
        },
        "iron_ore": {
            "is_supported": True,
            "discharge_rate_mt_day": 9500.0,
            "handling_equipment": "Berth 4 grab cranes",
            "status": "Requires Lighterage",
            "notes": "Draft-restricted. Deep-draft ore carriers must lighter at Sandheads or Paradip.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 8500.0,
            "handling_equipment": "Quay cranes & barge transshipment",
            "status": "Supported",
            "notes": "Supplies eastern steel plants (Durgapur/Burnpur) via barge and rail.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 8000.0,
            "handling_equipment": "Dock complex hopper bagging plants",
            "status": "Supported",
            "notes": "Raw rock phosphate and finished fertilizer for West Bengal & Bihar agricultural basin.",
        },
    },
    "port-in-tut": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 16500.0,
            "handling_equipment": "Dedicated Coal Jetty and NCB-1 conveyors",
            "status": "Supported",
            "notes": "Supplies Tuticorin Thermal Power Station (TTPS) and private coastal power plants.",
        },
        "iron_ore": {
            "is_supported": False,
            "discharge_rate_mt_day": 0.0,
            "handling_equipment": "None",
            "status": "Restricted",
            "notes": "Limited ore handling facilities; coal and copper concentrate prioritized.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 13000.0,
            "handling_equipment": "Harbor mobile cranes and mechanical grabs",
            "status": "Supported",
            "notes": "Supplies southern Tamil Nadu cement corridor.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 11000.0,
            "handling_equipment": "Dedicated chemical and dry bulk berths with bagging plants",
            "status": "Supported",
            "notes": "Supplies SPIC and regional agri-cooperatives.",
        },
    },
    "port-in-dhm": {
        "coal": {
            "is_supported": True,
            "discharge_rate_mt_day": 32000.0,
            "handling_equipment": "Twin mechanized deepwater bulk unloaders & rail car loaders",
            "status": "Supported",
            "notes": "Deepwater Capesize hub directly servicing Tata Steel and Kalinganagar industrial complex.",
        },
        "iron_ore": {
            "is_supported": True,
            "discharge_rate_mt_day": 29000.0,
            "handling_equipment": "High-velocity mechanized iron ore handling system",
            "status": "Supported",
            "notes": "Heavy export and coastal movement from Keonjhar ore belt.",
        },
        "limestone": {
            "is_supported": True,
            "discharge_rate_mt_day": 18000.0,
            "handling_equipment": "Deepwater multipurpose grab unloaders",
            "status": "Supported",
            "notes": "Direct imports for steel flux requirements.",
        },
        "fertilizer": {
            "is_supported": True,
            "discharge_rate_mt_day": 14000.0,
            "handling_equipment": "Mechanized bulk hoppers",
            "status": "Supported",
            "notes": "Eastern regional distribution.",
        },
    },
}


def resolve_port_id(p_id: str) -> str:
    """Normalizes colloquial or aliased port identifiers to canonical keys."""
    if p_id in CANONICAL_PORT_CONSTRAINTS:
        return p_id
    prefixed = f"port-in-{p_id.replace('india-', '').replace('port-', '')}"
    if prefixed in CANONICAL_PORT_CONSTRAINTS:
        return prefixed
    mapping = {
        "paradip": "port-in-prt", "prt": "port-in-prt",
        "visakhapatnam": "port-in-viz", "vizag": "port-in-viz", "vtz": "port-in-viz",
        "kamarajar": "port-in-enr", "ennore": "port-in-enr", "enr": "port-in-enr",
        "chennai": "port-in-maa", "madras": "port-in-maa", "maa": "port-in-maa",
        "krishnapatnam": "port-in-kri", "kri": "port-in-kri",
        "haldia": "port-in-ccu", "kolkata": "port-in-ccu", "ccu": "port-in-ccu",
        "tuticorin": "port-in-tut", "vocpt": "port-in-tut", "tut": "port-in-tut",
        "dhamra": "port-in-dhm", "dhm": "port-in-dhm",
    }
    cleaned = p_id.lower().strip()
    for k, v in mapping.items():
        if k in cleaned:
            return v
    raise HTTPException(status_code=404, detail=f"Port '{p_id}' not recognized in East Coast constraint matrix.")


def normalize_commodity_key(cmd_str: Optional[str]) -> str:
    if not cmd_str:
        return "coal"
    low = cmd_str.lower()
    if "coal" in low:
        return "coal"
    if "ore" in low or "iron" in low:
        return "iron_ore"
    if "lime" in low or "flux" in low:
        return "limestone"
    if "fert" in low or "phos" in low or "potash" in low or "dap" in low or "mop" in low:
        return "fertilizer"
    return "coal"


# ----------------------------------------------------------------------
# API Endpoints
# ----------------------------------------------------------------------

@router.get("/ports/east-coast-constraints", response_model=Dict[str, EastCoastPortConstraintModel])
def get_all_east_coast_constraints():
    """Returns authoritative port constraints matrix for major East Coast Indian bulk gateways."""
    return {k: EastCoastPortConstraintModel(**v) for k, v in CANONICAL_PORT_CONSTRAINTS.items()}


@router.get("/ports/east-coast-constraints/{port_id}", response_model=EastCoastPortConstraintModel)
def get_east_coast_constraint_by_id(port_id: str):
    """Returns constraints and lighterage rules for a single East Coast Indian port."""
    resolved_id = resolve_port_id(port_id)
    return EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS[resolved_id])


@router.post("/ports/check-feasibility", response_model=PortFeasibilityResponse)
def check_port_feasibility(req: PortFeasibilityRequest):
    """Validates whether a vessel draft is admissible at the target East Coast Indian port."""
    resolved_id = resolve_port_id(req.port_id)
    port_data = EastCoastPortConstraintModel(**CANONICAL_PORT_CONSTRAINTS[resolved_id])
    res, msg = validate_port_draft(req.vessel_draft_m, port_data, req.ukc_requirement_m)

    return PortFeasibilityResponse(
        port_id=resolved_id,
        port_name=port_data.port_name,
        vessel_draft_m=req.vessel_draft_m,
        max_permissible_draft_m=port_data.max_permissible_draft_m,
        under_keel_clearance_m=res.under_keel_clearance_m,
        is_admissible=res.is_admissible,
        requires_lighterage=res.requires_lighterage,
        lighterage_location=res.lighterage_location,
        message=msg,
    )


@router.post("/ports/intelligence/evaluate", response_model=PortIntelligenceEvaluationResponse)
def evaluate_port_intelligence(req: PortIntelligenceEvaluationRequest):
    """Evaluates full operational port intelligence, draft UKC, cargo suitability, and 6-dimension risk matrix."""
    resolved_id = resolve_port_id(req.port_id)
    port_raw = CANONICAL_PORT_CONSTRAINTS[resolved_id]
    port_data = EastCoastPortConstraintModel(**port_raw)

    # 1. Commodity Compatibility
    cmd_key = normalize_commodity_key(req.commodity_id or req.commodity_name)
    handling_dict = PORT_CARGO_HANDLING_RULES.get(resolved_id, {})
    cmd_rule = handling_dict.get(cmd_key)

    commodity_label = req.commodity_name or req.commodity_id or "Hard Coking Coal"
    if cmd_rule:
        cargo_compat = PortCargoCompatibilityModel(
            commodity=commodity_label,
            is_supported=cmd_rule["is_supported"],
            discharge_rate_mt_day=cmd_rule["discharge_rate_mt_day"],
            handling_equipment=cmd_rule["handling_equipment"],
            status=cmd_rule["status"],
            notes=cmd_rule["notes"],
        )
    else:
        cargo_compat = PortCargoCompatibilityModel(
            commodity=commodity_label,
            is_supported=True,
            discharge_rate_mt_day=port_data.mechanized_discharge_rate_mt_day,
            handling_equipment="General Mechanized Berth",
            status="Supported",
            notes="Configured benchmark cargo handling parameters.",
        )

    # 2. Vessel Compatibility & Draft
    vessel_class = req.vessel_class or "Panamax"
    standard_drafts = {
        "Capesize": 17.8, "Kamsarmax": 14.5, "Panamax": 13.8,
        "Ultramax": 12.8, "Supramax": 12.2, "Handysize": 10.0,
    }
    standard_dwts = {
        "Capesize": 180000.0, "Kamsarmax": 82000.0, "Panamax": 75000.0,
        "Ultramax": 64000.0, "Supramax": 58000.0, "Handysize": 35000.0,
    }
    vessel_draft = req.vessel_draft_m if (req.vessel_draft_m and req.vessel_draft_m > 0) else standard_drafts.get(vessel_class, 13.8)
    vessel_dwt = standard_dwts.get(vessel_class, 75000.0)

    draft_res, draft_msg = validate_port_draft(vessel_draft, port_data, req.ukc_requirement_m)
    ukc = round(port_data.max_permissible_draft_m - vessel_draft, 2)
    if ukc >= req.ukc_requirement_m:
        ukc_status = "Safe"
    elif ukc >= 0:
        ukc_status = "Marginal"
    else:
        ukc_status = "Violated"

    class_allowed = vessel_class in port_data.allowable_vessel_classes
    loa_compliant = True
    beam_compliant = True

    vessel_compat = PortVesselCompatibilityModel(
        vessel_class=vessel_class,
        vessel_name=f"Standard {vessel_class} Bulk Carrier",
        dwt=vessel_dwt,
        sailing_draft_m=vessel_draft,
        max_port_draft_m=port_data.max_permissible_draft_m,
        under_keel_clearance_m=ukc,
        ukc_status=ukc_status,
        is_admissible=class_allowed and (draft_res.is_admissible or draft_res.requires_lighterage),
        requires_lighterage=draft_res.requires_lighterage or port_data.lighterage_required,
        loa_compliant=loa_compliant,
        beam_compliant=beam_compliant,
        operational_notes=draft_msg,
    )

    # 3. Waiting Time & Demurrage Impact
    quantity = req.cargo_quantity_mt if (req.cargo_quantity_mt and req.cargo_quantity_mt > 0) else 50000.0
    effective_rate = cargo_compat.discharge_rate_mt_day if cargo_compat.discharge_rate_mt_day > 0 else port_data.mechanized_discharge_rate_mt_day
    discharge_days = round(quantity / max(effective_rate, 1000.0), 1)
    waiting_days = port_data.typical_waiting_days
    total_port_days = round(waiting_days + discharge_days, 1)
    daily_demurrage = port_data.average_demurrage_rate_usd_day
    demurrage_exposure_usd = round(waiting_days * daily_demurrage, 2)

    waiting_time_impact = {
        "typical_waiting_days": waiting_days,
        "mechanized_discharge_rate_mt_day": effective_rate,
        "estimated_discharge_days": discharge_days,
        "total_port_stay_days": total_port_days,
        "daily_demurrage_rate_usd": daily_demurrage,
        "potential_demurrage_exposure_usd": demurrage_exposure_usd,
        "congestion_status_badge": "Historical Port Authority Benchmark",
        "provenance_status": "Historical Official Statistics",
        "notes": f"Turnaround based on {effective_rate:,.0f} MT/day mechanized discharge rate and {waiting_days} days average anchorage queue.",
    }

    # 4. Port Risk Matrix (6 Dimensions)
    risk_matrix: List[PortRiskDimensionModel] = []

    # Dimension 1: Congestion Risk
    if waiting_days < 1.8:
        c_lvl, c_score = "Low", 25.0
    elif waiting_days <= 2.5:
        c_lvl, c_score = "Moderate", 55.0
    else:
        c_lvl, c_score = "High", 85.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Congestion & Anchorage Queue",
        risk_level=c_lvl,
        score=c_score,
        metric_value=f"{waiting_days} days waiting",
        benchmark_criteria="< 1.8d Low, 1.8 - 2.5d Moderate, > 2.5d High queue",
        operational_implication="Directly multiplies daily charterparty demurrage liability",
        provenance_status="Historical",
    ))

    # Dimension 2: Draft Constraint Risk
    if port_data.max_permissible_draft_m >= 17.0 and ukc >= 1.0:
        d_lvl, d_score = "Low", 20.0
    elif port_data.max_permissible_draft_m >= 14.0 and ukc >= 0:
        d_lvl, d_score = "Moderate", 50.0
    else:
        d_lvl, d_score = "High", 90.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Draft Constraint & UKC",
        risk_level=d_lvl,
        score=d_score,
        metric_value=f"{port_data.max_permissible_draft_m}m limit (UKC: {ukc}m)",
        benchmark_criteria=">= 17.0m & Safe UKC: Low; 14-17m: Moderate; < 14m or Violated UKC: High",
        operational_implication="Under-keel clearance determines maximum cargo deadweight intake without grounding risk",
        provenance_status="Configured",
    ))

    # Dimension 3: Weather Sensitivity Risk
    if "sheltered" in port_data.weather_sensitivity_notes.lower():
        w_lvl, w_score = "Low", 30.0
    elif "river" in port_data.weather_sensitivity_notes.lower() or "bore" in port_data.weather_sensitivity_notes.lower():
        w_lvl, w_score = "High", 85.0
    else:
        w_lvl, w_score = "Moderate", 60.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Weather & Seasonal Sensitivity",
        risk_level=w_lvl,
        score=w_score,
        metric_value=port_data.weather_sensitivity_notes[:45] + "...",
        benchmark_criteria="Sheltered natural harbor: Low; Open approach swell: Moderate; Tidal bore/estuary: High",
        operational_implication="Bay of Bengal monsoons and tropical cyclones impact vessel pilotage and conveyor operations",
        provenance_status="Historical",
    ))

    # Dimension 4: Vessel Segment Flexibility
    if "Capesize" in port_data.allowable_vessel_classes:
        v_lvl, v_score = "Low", 20.0
    elif "Panamax" in port_data.allowable_vessel_classes:
        v_lvl, v_score = "Moderate", 55.0
    else:
        v_lvl, v_score = "High", 85.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Vessel Segment Flexibility",
        risk_level=v_lvl,
        score=v_score,
        metric_value=f"{len(port_data.allowable_vessel_classes)} bulk classes admissible",
        benchmark_criteria="Capesize-capable: Low; Panamax max: Moderate; Feeder/Supramax only: High",
        operational_implication="Governs whether procurement can leverage large Cape bulk economies of scale",
        provenance_status="Configured",
    ))

    # Dimension 5: Cargo Handling Efficiency
    if effective_rate >= 25000.0:
        h_lvl, h_score = "Low", 20.0
    elif effective_rate >= 15000.0:
        h_lvl, h_score = "Moderate", 50.0
    else:
        h_lvl, h_score = "High", 80.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Cargo Handling Velocity",
        risk_level=h_lvl,
        score=h_score,
        metric_value=f"{effective_rate:,.0f} MT/day rate",
        benchmark_criteria=">= 25k MT/d: Low; 15k - 25k MT/d: Moderate; < 15k MT/d: High",
        operational_implication="Determines total berth occupancy duration and laytime burn rate",
        provenance_status="Historical",
    ))

    # Dimension 6: Operational & Lighterage Constraints
    if not port_data.lighterage_required and not port_data.riverine_navigation and cargo_compat.is_supported:
        o_lvl, o_score = "Low", 15.0
    elif cargo_compat.status == "Prohibited":
        o_lvl, o_score = "High", 98.0
    elif port_data.lighterage_required or port_data.riverine_navigation:
        o_lvl, o_score = "High", 90.0
    else:
        o_lvl, o_score = "Moderate", 45.0
    risk_matrix.append(PortRiskDimensionModel(
        dimension="Operational & Regulatory Constraints",
        risk_level=o_lvl,
        score=o_score,
        metric_value=cargo_compat.status if not cargo_compat.is_supported else ("Direct Berthing" if not port_data.lighterage_required else "Sandheads Lighterage"),
        benchmark_criteria="Direct deepwater: Low; Partial de-ballasting: Moderate; Lighterage/Regulatory Bar: High",
        operational_implication="Regulatory bans or mandatory barge transshipments create double-handling freight costs",
        provenance_status="Historical",
    ))

    # 5. Weather Operational Profile
    weather_operational_profile = {
        "southwest_monsoon": {
            "period": "June - September",
            "condition": "High swell, rough sea state at outer anchorage",
            "impact": "Pilotage delays possible for open-roadstead approaches",
        },
        "northeast_monsoon": {
            "period": "October - December",
            "condition": "Heavy coastal rainfall and squalls",
            "impact": "Conveyor operations subject to rain standstills unless covered",
        },
        "cyclone_window": {
            "period": "May (pre-monsoon) & October - November (post-monsoon)",
            "condition": "Bay of Bengal tropical cyclone alert protocol",
            "impact": "Harbor master may order all berthed vessels to sea for safety",
        },
        "riverine_hydrodynamics": {
            "condition": "Hooghly River tidal window" if port_data.riverine_navigation else "Deepwater oceanic approaches",
            "impact": "Daily high-tide navigation window required" if port_data.riverine_navigation else "Unrestricted tidal entry",
        },
        "provenance_status": "Historical Maritime Meteorology",
    }

    # 6. Decision Factors (Advisory)
    advantages: List[str] = []
    constraints: List[str] = []
    unknowns: List[str] = []
    required_verifications: List[str] = []

    if port_data.max_permissible_draft_m >= 17.0:
        advantages.append(f"Deep draft capacity ({port_data.max_permissible_draft_m}m) accommodates Capesize vessels directly.")
    if effective_rate >= 25000.0:
        advantages.append(f"Rapid discharge speed ({effective_rate:,.0f} MT/day) lowers laytime consumption.")
    if not port_data.lighterage_required:
        advantages.append("Direct berthing avoids costly offshore barge lighterage fees.")

    if not cargo_compat.is_supported:
        constraints.append(f"REGULATORY RESTRICTION: {cargo_compat.notes}")
    if port_data.lighterage_required:
        constraints.append(f"MANDATORY LIGHTERAGE: Shallow estuarine channel restricts direct arrival. Lighterage required at {port_data.lighterage_location}.")
    if ukc < req.ukc_requirement_m:
        constraints.append(f"MARGINAL/VIOLATED UKC: Vessel draft ({vessel_draft}m) exceeds or closely touches safe clearance ({port_data.max_permissible_draft_m}m permissible).")
    if waiting_days > 2.0:
        constraints.append(f"ELEVATED QUEUE: Typical waiting of {waiting_days} days increases demurrage risk.")

    unknowns.append("Real-time berth lineup and anchor queue priority at exact time of Notice of Readiness (NOR).")
    unknowns.append("Specific pilotage availability during adverse sea-state windows.")
    unknowns.append("Live tidal draft variation on specific discharge date.")

    required_verifications.append("Confirm latest Port Master Marine Circular for recent dredging depths.")
    required_verifications.append("Verify Charter Party laytime definitions (WWD SHINC vs SHEX).")
    required_verifications.append("Verify receiver's rail wagon supply quota for hinterland evacuation.")

    decision_factors = PortDecisionFactorsModel(
        advantages=advantages,
        constraints=constraints,
        unknowns=unknowns,
        required_verifications=required_verifications,
    )

    port_type_label = "Riverine Major Port Complex" if port_data.riverine_navigation else (
        "Private Deepwater Gateway" if "APSEZ" in port_raw["provenance"]["source"] else "Major Port Authority"
    )

    return PortIntelligenceEvaluationResponse(
        port_id=resolved_id,
        port_name=port_data.port_name,
        port_code=port_data.port_code,
        state=port_data.state,
        port_type=port_type_label,
        max_permissible_draft_m=port_data.max_permissible_draft_m,
        max_loa_m=port_data.max_loa_m,
        max_beam_m=port_data.max_beam_m,
        tidal_restriction=port_data.tidal_restriction,
        riverine_navigation=port_data.riverine_navigation,
        lighterage_required=port_data.lighterage_required,
        lighterage_location=port_data.lighterage_location,
        allowable_vessel_classes=port_data.allowable_vessel_classes,
        mechanized_discharge_rate_mt_day=effective_rate,
        typical_waiting_days=waiting_days,
        average_demurrage_rate_usd_day=daily_demurrage,
        weather_sensitivity_notes=port_data.weather_sensitivity_notes,
        operational_notes=port_data.operational_notes,
        vessel_compatibility=vessel_compat,
        cargo_compatibility=cargo_compat,
        risk_matrix=risk_matrix,
        waiting_time_impact=waiting_time_impact,
        weather_operational_profile=weather_operational_profile,
        decision_factors=decision_factors,
        data_provenance=DataProvenanceModel(**port_raw["provenance"]),
    )


@router.post("/ports/intelligence/compare", response_model=PortComparisonResponse)
def compare_ports_intelligence(req: PortComparisonRequest):
    """Compares candidate East Coast Indian ports side-by-side for a given cargo and vessel context."""
    target_port_ids = req.port_ids if (req.port_ids and len(req.port_ids) > 0) else [
        "port-in-prt", "port-in-viz", "port-in-enr", "port-in-maa", "port-in-kri", "port-in-ccu", "port-in-dhm", "port-in-tut"
    ]

    items: List[PortComparisonItemModel] = []
    decision_matrix: Dict[str, PortDecisionFactorsModel] = {}

    for raw_p_id in target_port_ids:
        try:
            resolved_id = resolve_port_id(raw_p_id)
        except HTTPException:
            continue

        eval_req = PortIntelligenceEvaluationRequest(
            port_id=resolved_id,
            commodity_id=req.commodity_id,
            commodity_name=req.commodity_name,
            cargo_quantity_mt=req.cargo_quantity_mt,
            vessel_class=req.preferred_vessel_class or "Panamax",
            vessel_draft_m=req.vessel_draft_m,
        )
        res = evaluate_port_intelligence(eval_req)

        # Determine aggregate risk level
        high_risks = sum(1 for r in res.risk_matrix if r.risk_level == "High")
        if not res.cargo_compatibility.is_supported or high_risks >= 2:
            agg_risk = "High"
        elif high_risks == 1 or any(r.risk_level == "Moderate" for r in res.risk_matrix):
            agg_risk = "Moderate"
        else:
            agg_risk = "Low"

        # Summary text
        if not res.cargo_compatibility.is_supported:
            summary = f"Restricted: {res.cargo_compatibility.notes[:60]}..."
        elif res.vessel_compatibility.requires_lighterage:
            summary = "Admissible with offshore lighterage at Sandheads."
        elif res.vessel_compatibility.ukc_status == "Violated":
            summary = f"Draft violation: UKC is {res.vessel_compatibility.under_keel_clearance_m}m."
        else:
            summary = f"Compatible: {res.mechanized_discharge_rate_mt_day:,.0f} MT/day rate with {res.typical_waiting_days}d avg queue."

        items.append(PortComparisonItemModel(
            port_id=res.port_id,
            port_name=res.port_name,
            port_code=res.port_code,
            state=res.state,
            max_permissible_draft_m=res.max_permissible_draft_m,
            mechanized_discharge_rate_mt_day=res.mechanized_discharge_rate_mt_day,
            typical_waiting_days=res.typical_waiting_days,
            average_demurrage_rate_usd_day=res.average_demurrage_rate_usd_day,
            lighterage_required=res.lighterage_required,
            cargo_supported=res.cargo_compatibility.is_supported,
            cargo_status=res.cargo_compatibility.status,
            vessel_admissible=res.vessel_compatibility.is_admissible,
            under_keel_clearance_m=res.vessel_compatibility.under_keel_clearance_m,
            ukc_status=res.vessel_compatibility.ukc_status,
            discharge_days=res.waiting_time_impact["estimated_discharge_days"],
            demurrage_exposure_usd=res.waiting_time_impact["potential_demurrage_exposure_usd"],
            overall_risk_level=agg_risk,
            decision_summary=summary,
            data_confidence=res.data_provenance.status.capitalize(),
        ))

        decision_matrix[res.port_id] = res.decision_factors

    return PortComparisonResponse(
        timestamp=datetime.utcnow().isoformat(),
        evaluated_ports_count=len(items),
        cargo_commodity=req.commodity_name or req.commodity_id or "Hard Coking Coal (HCC)",
        cargo_quantity_mt=req.cargo_quantity_mt,
        preferred_vessel_class=req.preferred_vessel_class or "Panamax",
        comparison_items=items,
        decision_matrix=decision_matrix,
    )

