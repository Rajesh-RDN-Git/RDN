import { apiClient } from '../api-client';

export const grievancesApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/grievances', { params }),
  getById: (id: string) => apiClient.get(`/grievances/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/grievances', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/grievances/${id}`, data),
  escalate: (id: string) => apiClient.post(`/grievances/${id}/escalate`),
};
