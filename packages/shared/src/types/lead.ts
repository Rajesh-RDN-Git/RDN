export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  NOT_PICKED = 'NOT_PICKED',
  INTERESTED = 'INTERESTED',
  QUALIFIED = 'QUALIFIED',
  VISIT_SCHEDULED = 'VISIT_SCHEDULED',
  VISITED = 'VISITED',
  NEGOTIATING = 'NEGOTIATING',
  MEETING_ARRANGED = 'MEETING_ARRANGED',
  DEAL_OPEN = 'DEAL_OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
  LOST = 'LOST',
}

export enum LeadSource {
  APP_SEARCH = 'APP_SEARCH',
  REFERRAL = 'REFERRAL',
  WHATSAPP = 'WHATSAPP',
  WALK_IN = 'WALK_IN',
}

export interface ILead {
  id: string;
  propertyId: string;
  buyerId: string;
  dealerId: string | null;
  societyId: string;
  source: LeadSource;
  status: LeadStatus;
  visitDate: Date | null;
  visitApprovedByOwner: boolean;
  notes: Record<string, unknown>[];
  autoReassigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
