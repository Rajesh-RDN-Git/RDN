import { apiClient } from '../api-client';

export const grievanceApi = {
  list: (params?: Record<string, string>) => apiClient.get('/grievances', { params }),
  getById: (id: string) => apiClient.get(`/grievances/${id}`),
  create: (data: {
    category: string;
    severity: string;
    description: string;
    evidenceUrls?: string[];
    againstUserId?: string;
    societyId?: string;
    transactionId?: string;
  }) => apiClient.post('/grievances', data),
  update: (id: string, data: { status?: string; resolutionNotes?: string; assignedTo?: string }) =>
    apiClient.patch(`/grievances/${id}`, data),
  escalate: (id: string) => apiClient.post(`/grievances/${id}/escalate`),
};
