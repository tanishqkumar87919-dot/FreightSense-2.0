import {
  CharterRequest,
  CharterValidationResult,
  DryBulkVesselClass,
  EastCoastPortConstraint,
} from '@/types';

/**
 * Validates cargo parcel quantity.
 */
export function validateCargoQuantity(quantityMt: number, vesselClass?: DryBulkVesselClass): { valid: boolean; error?: string } {
  if (typeof quantityMt !== 'number' || isNaN(quantityMt) || quantityMt <= 0) {
    return { valid: false, error: 'Cargo quantity must be a strictly positive number (> 0 MT).' };
  }
  if (quantityMt > 350000) {
    return { valid: false, error: 'Cargo parcel exceeds maximum global dry bulk vessel limits (350,000 MT).' };
  }
  if (vesselClass) {
    if (quantityMt > vesselClass.dwtMax * 0.95) {
      return {
        valid: false,
        error: `Cargo parcel (${quantityMt.toLocaleString()} MT) exceeds safe cargo intake for ${vesselClass.name} (max payload ~${Math.round(vesselClass.dwtMax * 0.95).toLocaleString()} MT).`,
      };
    }
    if (quantityMt < vesselClass.dwtMin * 0.6) {
      return {
        valid: false,
        error: `Cargo parcel (${quantityMt.toLocaleString()} MT) is critically undersized for ${vesselClass.name} (minimum practical parcel ~${Math.round(vesselClass.dwtMin * 0.6).toLocaleString()} MT).`,
      };
    }
  }
  return { valid: true };
}

/**
 * Validates charter laycan window (dates).
 */
export function validateLaycan(laycanStart: string, laycanEnd: string): { valid: boolean; error?: string; warning?: string } {
  const start = new Date(laycanStart);
  const end = new Date(laycanEnd);

  if (isNaN(start.getTime())) {
    return { valid: false, error: `Invalid laycan start date: "${laycanStart}". Format must be YYYY-MM-DD.` };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: `Invalid laycan end date: "${laycanEnd}". Format must be YYYY-MM-DD.` };
  }
  if (start > end) {
    return { valid: false, error: `Laycan start date (${laycanStart}) cannot be after laycan end date (${laycanEnd}).` };
  }

  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    return {
      valid: true,
      warning: `Laycan window is ${Math.round(diffDays)} days long. Standard dry bulk laycan spread is typically 5 to 14 days.`,
    };
  }
  if (diffDays === 0) {
    return {
      valid: true,
      warning: 'Single-day laycan carries severe cancellation risk if vessel arrival is delayed.',
    };
  }

  return { valid: true };
}

/**
 * Validates vessel draft against port constraints.
 * Standard safety under-keel clearance (UKC) is 1.0 meter.
 */
export function validatePortDraftCompatibility(
  vesselDraftMeters: number,
  portConstraint: EastCoastPortConstraint,
  ukcRequirementMeters: number = 1.0
): {
  isAdmissible: boolean;
  requiresLighterage: boolean;
  underKeelClearanceMeters: number;
  message: string;
} {
  const effectivePortDraft = portConstraint.maxPermissibleDraftMeters;
  const underKeelClearance = effectivePortDraft - vesselDraftMeters;

  if (underKeelClearance >= ukcRequirementMeters) {
    return {
      isAdmissible: true,
      requiresLighterage: false,
      underKeelClearanceMeters: parseFloat(underKeelClearance.toFixed(2)),
      message: `Vessel fully admissible at ${portConstraint.portName}. UKC: ${underKeelClearance.toFixed(2)}m (Min required: ${ukcRequirementMeters}m).`,
    };
  }

  // If draft is exceeded, check if port supports lighterage
  if (portConstraint.lighterageRequired || portConstraint.riverineNavigation) {
    return {
      isAdmissible: true,
      requiresLighterage: true,
      underKeelClearanceMeters: parseFloat(underKeelClearance.toFixed(2)),
      message: `Direct berthing restricted at ${portConstraint.portName} (Draft: ${vesselDraftMeters}m > Max: ${effectivePortDraft}m). Lighterage required at ${portConstraint.lighterageLocation || 'Outer Anchorage / Sandheads'} prior to inner channel entry.`,
    };
  }

  return {
    isAdmissible: false,
    requiresLighterage: false,
    underKeelClearanceMeters: parseFloat(underKeelClearance.toFixed(2)),
    message: `Vessel draft (${vesselDraftMeters}m) exceeds ${portConstraint.portName} maximum limit (${effectivePortDraft}m) by ${(vesselDraftMeters - effectivePortDraft).toFixed(2)}m. Port does not operate lighterage berths for this draft deficit.`,
  };
}

/**
 * Comprehensive Charter Party Pre-Fixture Validation Engine.
 */
export function validateCharterRequest(
  request: CharterRequest,
  vesselClass: DryBulkVesselClass,
  destinationPortConstraint: EastCoastPortConstraint
): CharterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Cargo Quantity Check
  const qtyCheck = validateCargoQuantity(request.cargoQuantityMt, vesselClass);
  if (!qtyCheck.valid && qtyCheck.error) {
    errors.push(qtyCheck.error);
  }

  // 2. Laycan Check
  const laycanCheck = validateLaycan(request.laycanStart, request.laycanEnd);
  if (!laycanCheck.valid && laycanCheck.error) {
    errors.push(laycanCheck.error);
  } else if (laycanCheck.warning) {
    warnings.push(laycanCheck.warning);
  }

  // 3. Draft & Berth Feasibility Check
  let vesselDraft: number;
  if (request.maxDraftToleranceMeters) {
    vesselDraft = request.maxDraftToleranceMeters;
  } else {
    const loadFactor = Math.min(1.0, Math.max(0.4, request.cargoQuantityMt / (vesselClass.dwtMax || 180000)));
    vesselDraft = parseFloat((vesselClass.typicalDraftMeters * (0.55 + 0.45 * loadFactor)).toFixed(2));
  }
  const draftCheck = validatePortDraftCompatibility(vesselDraft, destinationPortConstraint);

  if (!draftCheck.isAdmissible) {
    errors.push(draftCheck.message);
  } else if (draftCheck.requiresLighterage) {
    warnings.push(draftCheck.message);
  }

  // 4. Vessel Class Compatibility
  if (!destinationPortConstraint.allowableVesselClasses.includes(request.preferredVesselClass)) {
    if (draftCheck.requiresLighterage) {
      warnings.push(
        `${request.preferredVesselClass} is not standardly berthed at ${destinationPortConstraint.portName}. Must use lighterage/top-off protocol.`
      );
    } else {
      errors.push(
        `${request.preferredVesselClass} vessel class is prohibited at ${destinationPortConstraint.portName}. Allowable classes: ${destinationPortConstraint.allowableVesselClasses.join(', ')}.`
      );
    }
  }

  // 5. Demurrage & Discharge Days Calculation
  const dailyDischarge = destinationPortConstraint.mechanizedDischargeRateMtPerDay || 20000;
  const dischargeDays = parseFloat((request.cargoQuantityMt / dailyDischarge).toFixed(1));
  const expectedWaitDays = destinationPortConstraint.typicalWaitingDays || 2.0;
  const demurrageRate = destinationPortConstraint.averageDemurrageRateUsdPerDay || 25000;
  const estimatedDemurrageExposure = Math.round(expectedWaitDays * demurrageRate);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    draftFeasibility: {
      vesselDraftMeters: vesselDraft,
      maxPortDraftMeters: destinationPortConstraint.maxPermissibleDraftMeters,
      underKeelClearanceMeters: draftCheck.underKeelClearanceMeters,
      isAdmissible: draftCheck.isAdmissible,
      requiresLighterage: draftCheck.requiresLighterage,
      lighterageLocation: destinationPortConstraint.lighterageLocation,
    },
    estimatedDischargeDays: dischargeDays,
    estimatedDemurrageExposureUsd: estimatedDemurrageExposure,
  };
}
