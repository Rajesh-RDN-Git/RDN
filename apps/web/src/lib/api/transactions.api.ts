import { apiClient } from '../api-client';

export const transactionsApi = {
  list: (params?: Record<string, unknown>) => apiClient.get('/transactions', { params }),
  getById: (id: string) => apiClient.get(`/transactions/${id}`),
  create: (data: { leadId: string; type: string; dealValue: number }) =>
    apiClient.post('/transactions', data),
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    apiClient.patch(`/transactions/${id}/payment-status`, { paymentStatus }),
};
