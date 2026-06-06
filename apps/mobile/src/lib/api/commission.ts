import { apiClient } from '../api-client';

export const commissionApi = {
  list: (params?: Record<string, string>) => apiClient.get('/commissions', { params }),
  getById: (id: string) => apiClient.get(`/commissions/${id}`),
  settle: (id: string, data: { payoutReference: string; settlementDate?: string }) =>
    apiClient.post(`/commissions/${id}/settle`, data),
  distribute: (id: string) => apiClient.post(`/commissions/${id}/distribute`),
  cancel: (id: string, data?: { reason?: string }) =>
    apiClient.post(`/commissions/${id}/cancel`, data ?? {}),
};
