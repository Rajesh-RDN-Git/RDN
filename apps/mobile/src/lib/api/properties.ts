import { apiClient } from '../api-client';

export const propertiesApi = {
  list: (params?: Record<string, string>) => apiClient.get('/properties', { params }),

  getById: (id: string) => apiClient.get(`/properties/${id}`),

  create: (data: Record<string, unknown>) => apiClient.post('/properties', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/properties/${id}`, data),

  delist: (id: string) => apiClient.patch(`/properties/${id}/delist`),
};
