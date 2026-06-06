import { apiClient } from '../api-client';

export type CommissionStatus = 'PENDING' | 'SETTLED' | 'DISTRIBUTED' | 'CANCELLED';

export const commissionsApi = {
  list: (params?: {
    status?: CommissionStatus;
    page?: number;
    limit?: number;
    dealerId?: string;
    from?: string;
    to?: string;
  }) => apiClient.get('/commissions', { params }),
  getById: (id: string) => apiClient.get(`/commissions/${id}`),
  settle: (id: string, data: { payoutReference: string; settlementDate?: string }) =>
    apiClient.post(`/commissions/${id}/settle`, data),
  distribute: (id: string) => apiClient.post(`/commissions/${id}/distribute`),
  cancel: (id: string, data: { reason?: string } = {}) =>
    apiClient.post(`/commissions/${id}/cancel`, data),
};
