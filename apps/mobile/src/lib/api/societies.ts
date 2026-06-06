import { apiClient } from '../api-client';

export const societiesApi = {
  list: (params?: Record<string, string>) => apiClient.get('/societies', { params }),

  getBySlug: (slug: string) => apiClient.get(`/societies/${slug}`),

  create: (data: Record<string, unknown>) => apiClient.post('/societies', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/societies/${id}`, data),
};
