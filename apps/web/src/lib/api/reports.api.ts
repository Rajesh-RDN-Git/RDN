import { apiClient } from '../api-client';

export const reportsApi = {
  dashboard: () => apiClient.get('/reports/dashboard'),

  // Public, unauthenticated platform totals for homepage trust indicators.
  publicStats: () => apiClient.get('/public/stats'),

  transactions: (params?: Record<string, unknown>) =>
    apiClient.get('/reports/transactions', { params }),

  commissions: (params?: Record<string, unknown>) =>
    apiClient.get('/reports/commissions', { params }),

  leads: (params?: Record<string, unknown>) => apiClient.get('/reports/leads', { params }),
};
