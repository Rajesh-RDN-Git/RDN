export type WizardStep = 'basics' | 'specs' | 'pricing' | 'photos' | 'amenities' | 'review';

export const STEP_ORDER: WizardStep[] = [
  'basics',
  'specs',
  'pricing',
  'photos',
  'amenities',
  'review',
];

export type PhotoState = {
  id: string; // S3 key (also used as React key)
  key: string; // S3 key (explicit field for clarity in submission)
  url: string; // local blob URL for in-wizard preview
  persistUrl: string; // CDN/S3 URL stored server-side via addMedia
  isCover: boolean;
  order: number;
  uploadProgress?: number;
};

export type WizardData = {
  // Basics
  societyId: string;
  flatNumber: string;
  towerBlock: string;
  type: 'APARTMENT' | 'COMMERCIAL' | 'VILLA' | '';
  transactionType: 'RENT' | 'SALE' | 'BOTH' | '';
  // Specs
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
  // Pricing
  priceRent?: number;
  priceSale?: number;
  securityDeposit?: number;
  // Photos
  photos: PhotoState[];
  // Amenities & Restrictions
  amenities: string[];
  restrictions: Record<string, boolean>;
};

export type WizardState = {
  currentStep: WizardStep;
  data: WizardData;
  errors: Partial<Record<keyof WizardData, string>>;
  isDirty: boolean;
  draftLoadedAt?: number;
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
