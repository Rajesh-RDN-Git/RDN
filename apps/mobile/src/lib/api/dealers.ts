import { apiClient } from '../api-client';

export const dealersApi = {
  list: (params?: Record<string, string>) => apiClient.get('/dealers', { params }),

  getById: (id: string) => apiClient.get(`/dealers/${id}`),

  apply: (data: { societyId: string; bankAccountDetails?: Record<string, string> }) =>
    apiClient.post('/dealers/apply', data),
};
