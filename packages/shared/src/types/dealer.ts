export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TrainingStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
}

export enum CertificationStatus {
  NOT_CERTIFIED = 'NOT_CERTIFIED',
  CERTIFIED = 'CERTIFIED',
  REVOKED = 'REVOKED',
}

export interface IDealer {
  id: string;
  userId: string;
  societyId: string;
  kycStatus: KYCStatus;
  rwaApprovalStatus: ApprovalStatus;
  trainingStatus: TrainingStatus;
  isActive: boolean;
  bankAccountDetails: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
