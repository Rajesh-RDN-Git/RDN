import { apiClient } from '../api-client';

export const dealersApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/dealers', { params }),
  getById: (id: string) => apiClient.get(`/dealers/${id}`),
  create: (data: {
    name: string;
    phone: string;
    email?: string;
    societyId: string;
    bankAccountDetails?: Record<string, unknown>;
  }) => apiClient.post('/dealers', data),
  apply: (data: { societyId: string; bankAccountDetails?: Record<string, unknown> }) =>
    apiClient.post('/dealers/apply', data),
  approve: (id: string) => apiClient.patch(`/dealers/${id}/approve`),
  reject: (id: string, reason?: string) => apiClient.patch(`/dealers/${id}/reject`, { reason }),
  updateKyc: (id: string, status: string) => apiClient.patch(`/dealers/${id}/kyc`, { status }),
  completeTraining: (id: string) => apiClient.patch(`/dealers/${id}/training-complete`),
  setActive: (id: string, isActive: boolean) =>
    apiClient.patch(`/dealers/${id}/active`, { isActive }),
  certify: (id: string) => apiClient.patch(`/dealers/${id}/certify`),
  revokeCertification: (id: string) => apiClient.patch(`/dealers/${id}/revoke-certification`),
};
