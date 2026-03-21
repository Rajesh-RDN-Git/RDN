import { apiClient } from '../api-client';

export const societiesApi = {
  list: (params?: Record<string, string>) => apiClient.get('/societies', { params }),

  getBySlug: (slug: string) => apiClient.get(`/societies/${slug}`),
};
