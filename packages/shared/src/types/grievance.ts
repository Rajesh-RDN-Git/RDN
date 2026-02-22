export enum GrievanceCategory {
  DEALER_CONDUCT = 'DEALER_CONDUCT',
  PROPERTY_MISMATCH = 'PROPERTY_MISMATCH',
  COMMISSION = 'COMMISSION',
  SERVICE = 'SERVICE',
  SAFETY = 'SAFETY',
  OTHER = 'OTHER',
}

export enum GrievanceSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum GrievanceStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export interface IGrievance {
  id: string;
  filedBy: string;
  againstUserId: string | null;
  societyId: string | null;
  transactionId: string | null;
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  description: string;
  evidenceUrls: string[];
  status: GrievanceStatus;
  escalationLevel: number;
  assignedTo: string | null;
  slaDeadline: Date;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}
