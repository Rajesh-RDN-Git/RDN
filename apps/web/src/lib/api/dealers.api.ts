import { apiClient } from '../api-client';

export const dealersApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/dealers', { params }),
  getById: (id: string) => apiClient.get(`/dealers/${id}`),
  apply: (data: Record<string, unknown>) => apiClient.post('/dealers/apply', data),
  approve: (id: string) => apiClient.patch(`/dealers/${id}/approve`),
  reject: (id: string, reason?: string) => apiClient.patch(`/dealers/${id}/reject`, { reason }),
  updateKyc: (id: string, status: string) => apiClient.patch(`/dealers/${id}/kyc`, { status }),
  completeTraining: (id: string) => apiClient.patch(`/dealers/${id}/training-complete`),
};
