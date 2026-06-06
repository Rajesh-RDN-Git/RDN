import { apiClient } from '../api-client';

export type GrievanceCategory =
  | 'DEALER_CONDUCT'
  | 'PROPERTY_MISMATCH'
  | 'COMMISSION'
  | 'SERVICE'
  | 'SAFETY'
  | 'KEY_ARRANGEMENT'
  | 'VISIT_TIME'
  | 'MEETING_AVAILABILITY'
  | 'OTHER';

export type GrievanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type GrievanceStatus = 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';

export interface GrievanceFilerRef {
  id: string;
  name: string;
}

export interface Grievance {
  id: string;
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  status: GrievanceStatus;
  description: string;
  resolutionNotes?: string | null;
  filedBy: string;
  againstUserId?: string | null;
  societyId?: string | null;
  transactionId?: string | null;
  evidenceUrls?: string[] | null;
  slaDeadline?: string | null;
  resolvedAt?: string | null;
  escalationLevel?: number;
  createdAt: string;
  updatedAt: string;
  filer?: GrievanceFilerRef | null;
  againstUser?: GrievanceFilerRef | null;
  assignee?: GrievanceFilerRef | null;
  society?: { id: string; name: string } | null;
}

export interface CreateGrievancePayload {
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  description: string;
  againstUserId?: string;
  societyId?: string;
  transactionId?: string;
  evidenceUrls?: string[];
}

export interface UpdateGrievancePayload {
  status?: GrievanceStatus;
  resolutionNotes?: string;
  assignedTo?: string;
}

export interface ListGrievancesParams {
  page?: number;
  limit?: number;
  status?: GrievanceStatus;
  severity?: GrievanceSeverity;
  category?: GrievanceCategory;
  societyId?: string;
}

export const grievancesApi = {
  list: (params?: ListGrievancesParams) => apiClient.get('/grievances', { params }),
  getById: (id: string) => apiClient.get(`/grievances/${id}`),
  create: (data: CreateGrievancePayload) => apiClient.post('/grievances', data),
  update: (id: string, data: UpdateGrievancePayload) => apiClient.patch(`/grievances/${id}`, data),
  escalate: (id: string) => apiClient.post(`/grievances/${id}/escalate`),
};
