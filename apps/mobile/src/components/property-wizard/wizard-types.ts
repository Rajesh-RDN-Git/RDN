export type WizardStep = 'basics' | 'specs' | 'pricing' | 'photos' | 'amenities' | 'review';

export const STEP_ORDER: WizardStep[] = [
  'basics',
  'specs',
  'pricing',
  'photos',
  'amenities',
  'review',
];

export const STEP_LABELS: Record<WizardStep, string> = {
  basics: 'Basics',
  specs: 'Specs',
  pricing: 'Pricing',
  photos: 'Photos',
  amenities: 'Amenities',
  review: 'Review',
};

export type PhotoState = {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
};

export type WizardData = {
  societyId: string;
  flatNumber: string;
  towerBlock: string;
  type: 'APARTMENT' | 'COMMERCIAL' | 'VILLA' | '';
  transactionType: 'RENT' | 'SALE' | 'BOTH' | '';
  bhk?: number;
  carpetArea?: number;
  superArea?: number;
  floor?: number;
  floorLabel?: 'GROUND' | 'TOP';
  totalFloors?: number;
  facing?: string;
  furnishing?: 'FURNISHED' | 'SEMI' | 'UNFURNISHED';
  description?: string;
  additionalRooms: string[];
  propertyView: string[];
  furnishingDetails: Record<string, number>;
  priceRent?: number;
  priceSale?: number;
  securityDeposit?: number;
  maintenance?: number;
  negotiable?: boolean;
  brokerageDisclosed?: boolean;
  photos: PhotoState[];
  amenities: string[];
  restrictions: Record<string, boolean>;
};

export type WizardState = {
  currentStep: WizardStep;
  data: WizardData;
  errors: Partial<Record<keyof WizardData, string>>;
  isDirty: boolean;
};

export type WizardAction =
  | { type: 'SET_FIELD'; field: keyof WizardData; value: WizardData[keyof WizardData] }
  | { type: 'SET_PHOTOS'; photos: PhotoState[] }
  | { type: 'GOTO_STEP'; step: WizardStep }
  | { type: 'SET_ERRORS'; errors: WizardState['errors'] }
  | { type: 'LOAD_DRAFT'; data: WizardData }
  | { type: 'RESET' };

export const INITIAL_DATA: WizardData = {
  societyId: '',
  flatNumber: '',
  towerBlock: '',
  type: '',
  transactionType: '',
  additionalRooms: [],
  propertyView: [],
  furnishingDetails: {},
  photos: [],
  amenities: [],
  restrictions: {},
};

export const AMENITIES_OPTIONS = [
  'Parking',
  'Lift',
  'Power backup',
  'Security',
  'Gym',
  'Swimming pool',
  'Garden',
  'Clubhouse',
  'Children play area',
  'Visitor parking',
];

export function validateStep(
  step: WizardStep,
  data: WizardData,
): { ok: boolean; errors: Partial<Record<keyof WizardData, string>> } {
  const errors: Partial<Record<keyof WizardData, string>> = {};

  if (step === 'basics') {
    if (!data.societyId) errors.societyId = 'Society required';
    if (!data.flatNumber) errors.flatNumber = 'Flat number required';
    if (!data.towerBlock) errors.towerBlock = 'Tower / block required';
    if (!data.type) errors.type = 'Property type required';
    if (!data.transactionType) errors.transactionType = 'Transaction type required';
  }
  if (step === 'specs') {
    if ((data.type === 'APARTMENT' || data.type === 'VILLA') && !data.bhk)
      errors.bhk = 'BHK required';
    if (!data.carpetArea) errors.carpetArea = 'Carpet area required';
  }
  if (step === 'pricing') {
    if ((data.transactionType === 'RENT' || data.transactionType === 'BOTH') && !data.priceRent)
      errors.priceRent = 'Monthly rent required';
    if ((data.transactionType === 'SALE' || data.transactionType === 'BOTH') && !data.priceSale)
      errors.priceSale = 'Sale price required';
  }
  if (step === 'photos') {
    if (data.photos.length < 3) errors.photos = 'At least 3 photos required';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
