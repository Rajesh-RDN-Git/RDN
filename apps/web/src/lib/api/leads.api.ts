import { apiClient } from '../api-client';

export const leadsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/leads', { params }),

  create: (data: Record<string, unknown>) => apiClient.post('/leads', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/leads/${id}`, data),

  approveVisit: (id: string) => apiClient.post(`/leads/${id}/approve-visit`),
};
