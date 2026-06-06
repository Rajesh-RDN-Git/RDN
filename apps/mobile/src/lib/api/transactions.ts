import { apiClient } from '../api-client';

export const transactionsApi = {
  list: (params?: Record<string, string>) => apiClient.get('/transactions', { params }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post('/transactions', data),
  updatePaymentStatus: (id: string, data: { paymentStatus: string }) =>
    apiClient.patch(`/transactions/${id}/payment-status`, data),
};
