export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

export enum SocietyStatus {
  ONBOARDED = 'ONBOARDED',
  IN_PROGRESS = 'IN_PROGRESS',
  INACTIVE = 'INACTIVE',
}

export interface ISociety {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  totalUnits: number | null;
  amenities: Record<string, unknown>[];
  rwaAdminId: string | null;
  verificationStatus: VerificationStatus;
  mandateStartDate: Date | null;
  mandateEndDate: Date | null;
  status: SocietyStatus;
  meta: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
