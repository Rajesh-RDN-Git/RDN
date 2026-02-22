export enum PropertyType {
  APARTMENT = 'APARTMENT',
  COMMERCIAL = 'COMMERCIAL',
  VILLA = 'VILLA',
}

export enum TransactionType {
  RENT = 'RENT',
  SALE = 'SALE',
  BOTH = 'BOTH',
}

export enum FurnishingType {
  FURNISHED = 'FURNISHED',
  SEMI = 'SEMI',
  UNFURNISHED = 'UNFURNISHED',
}

export enum AvailabilityStatus {
  AVAILABLE_NOW = 'AVAILABLE_NOW',
  AVAILABLE_FROM = 'AVAILABLE_FROM',
  UNDER_NOTICE = 'UNDER_NOTICE',
  OCCUPIED = 'OCCUPIED',
  SOLD = 'SOLD',
}

export enum PropertyVerificationStatus {
  PENDING = 'PENDING',
  RWA_APPROVED = 'RWA_APPROVED',
  VERIFIED = 'VERIFIED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  DELISTED = 'DELISTED',
  CLOSED = 'CLOSED',
}

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export interface IProperty {
  id: string;
  societyId: string;
  ownerId: string;
  assignedDealerId: string | null;
  flatNumber: string;
  towerBlock: string;
  type: PropertyType;
  transactionType: TransactionType;
  bhk: number | null;
  carpetArea: number | null;
  superArea: number | null;
  floor: number | null;
  totalFloors: number | null;
  facing: string | null;
  furnishing: FurnishingType | null;
  priceRent: number | null;
  priceSale: number | null;
  securityDeposit: number | null;
  availabilityStatus: AvailabilityStatus;
  availableFrom: Date | null;
  verificationStatus: PropertyVerificationStatus;
  restrictions: Record<string, unknown>;
  amenities: Record<string, unknown>;
  status: PropertyStatus;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyMedia {
  id: string;
  propertyId: string;
  url: string;
  type: MediaType;
  order: number;
  createdAt: Date;
}
