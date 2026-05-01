import { apiClient } from '../api-client';

export const propertiesApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/properties', { params }),

  getById: (id: string) => apiClient.get(`/properties/${id}`),

  create: (data: Record<string, unknown>) => apiClient.post('/properties', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/properties/${id}`, data),

  getVerificationQueue: () => apiClient.get('/properties/verification-queue'),

  updateVerification: (id: string, decision: 'RWA_APPROVED' | 'REJECTED', reason?: string) =>
    apiClient.patch(`/properties/${id}/verification`, { decision, reason }),
};
