import { apiClient } from '../api-client';

export const leadsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/leads', { params }),
  getById: (id: string) => apiClient.get(`/leads/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/leads', data),
  createManual: (data: Record<string, unknown>) => apiClient.post('/leads/manual', data),
  assign: (id: string, dealerId: string) => apiClient.patch(`/leads/${id}/assign`, { dealerId }),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/leads/${id}`, data),
  approveVisit: (id: string) => apiClient.patch(`/leads/${id}/approve-visit`),
  closeDeal: (id: string, data: { type: string; dealValue: number }) =>
    apiClient.post(`/leads/${id}/close-deal`, data),
};
