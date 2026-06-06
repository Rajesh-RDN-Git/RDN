import { apiClient } from '../api-client';

export const reportsApi = {
  dashboard: () => apiClient.get('/reports/dashboard'),
  leads: (params?: Record<string, string>) => apiClient.get('/reports/leads', { params }),
  transactions: (params?: Record<string, string>) =>
    apiClient.get('/reports/transactions', { params }),
  commissions: (params?: Record<string, string>) =>
    apiClient.get('/reports/commissions', { params }),
};
