import { WizardData, WizardStep } from './wizard-types';

type ValidationResult =
  | { ok: true; errors: Record<string, never> }
  | { ok: false; errors: Partial<Record<keyof WizardData, string>> };

export function validateStep(
  step: WizardStep,
  data: WizardData,
  mode: 'create' | 'edit' = 'create',
): ValidationResult {
  const errors: Partial<Record<keyof WizardData, string>> = {};

  if (step === 'basics') {
    if (!data.societyId) errors.societyId = 'Society required';
    if (!data.flatNumber) errors.flatNumber = 'Flat number required';
    if (!data.towerBlock) errors.towerBlock = 'Tower / block required';
    if (!data.type) errors.type = 'Property type required';
    if (!data.transactionType) errors.transactionType = 'Transaction type required';
  }

  if (step === 'specs') {
    if ((data.type === 'APARTMENT' || data.type === 'VILLA') && !data.bhk) {
      errors.bhk = 'BHK required';
    }
    if (!data.carpetArea) errors.carpetArea = 'Carpet area required';
  }

  if (step === 'pricing') {
    if ((data.transactionType === 'RENT' || data.transactionType === 'BOTH') && !data.priceRent) {
      errors.priceRent = 'Monthly rent required';
    }
    if ((data.transactionType === 'SALE' || data.transactionType === 'BOTH') && !data.priceSale) {
      errors.priceSale = 'Sale price required';
    }
  }

  if (step === 'photos' && mode !== 'edit') {
    // In edit mode existing photos aren't re-loaded into wizard state, so the
    // minimum-photo gate is skipped (photo editing is a later phase).
    if (data.photos.length < 3) errors.photos = 'At least 3 photos required';
  }

  if (Object.keys(errors).length === 0) return { ok: true, errors: {} };
  return { ok: false, errors };
}
