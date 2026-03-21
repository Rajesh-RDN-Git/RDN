import { apiClient } from '../api-client';

export const leadsApi = {
  list: (params?: Record<string, string>) => apiClient.get('/leads', { params }),

  getById: (id: string) => apiClient.get(`/leads/${id}`),

  create: (data: { propertyId: string; source?: string }) => apiClient.post('/leads', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/leads/${id}`, data),

  closeDeal: (id: string, data: { type: string; dealValue: number }) =>
    apiClient.post(`/leads/${id}/close-deal`, data),

  approveVisit: (id: string) => apiClient.patch(`/leads/${id}/approve-visit`),
};
