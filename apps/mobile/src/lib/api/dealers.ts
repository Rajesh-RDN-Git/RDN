import { apiClient } from '../api-client';

export const dealersApi = {
  list: (params?: Record<string, string>) => apiClient.get('/dealers', { params }),

  getById: (id: string) => apiClient.get(`/dealers/${id}`),

  apply: (data: { societyId: string; bankAccountDetails?: Record<string, string> }) =>
    apiClient.post('/dealers/apply', data),

  approve: (id: string) => apiClient.patch(`/dealers/${id}/approve`),

  reject: (id: string) => apiClient.patch(`/dealers/${id}/reject`),

  updateKyc: (id: string, data: { kycStatus: 'APPROVED' | 'REJECTED' }) =>
    apiClient.patch(`/dealers/${id}/kyc`, data),

  trainingComplete: (id: string) => apiClient.patch(`/dealers/${id}/training-complete`),

  setActive: (id: string, data: { isActive: boolean }) =>
    apiClient.patch(`/dealers/${id}/active`, data),

  certify: (id: string) => apiClient.patch(`/dealers/${id}/certify`),

  revokeCertification: (id: string) => apiClient.patch(`/dealers/${id}/revoke-certification`),
};
