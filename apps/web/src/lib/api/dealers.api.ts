import { apiClient } from '../api-client';

export const dealersApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/dealers', { params }),

  getById: (id: string) => apiClient.get(`/dealers/${id}`),

  approve: (id: string) => apiClient.post(`/dealers/${id}/approve`),

  reject: (id: string, reason?: string) => apiClient.post(`/dealers/${id}/reject`, { reason }),
};
