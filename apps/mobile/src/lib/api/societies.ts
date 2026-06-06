import { apiClient } from '../api-client';

export const societiesApi = {
  list: (params?: Record<string, string>) => apiClient.get('/societies', { params }),

  getBySlug: (slug: string) => apiClient.get(`/societies/${slug}`),

  create: (data: Record<string, unknown>) => apiClient.post('/societies', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/societies/${id}`, data),

  // SUPER_ADMIN only — assign or clear the RWA admin for a society.
  // Service-side promotes the user to RWA_ADMIN when needed.
  assignRwaAdmin: (id: string, rwaAdminId: string | null) =>
    apiClient.patch(`/societies/${id}`, { rwaAdminId }),

  // SUPER_ADMIN only — list users eligible to be assigned as RWA admin.
  // Defaults to existing RWA_ADMIN users; pass a different role to broaden the search.
  getRwaCandidates: (params?: { role?: string; limit?: number; search?: string }) =>
    apiClient.get('/users', { params: { role: 'RWA_ADMIN', limit: 50, ...(params || {}) } }),
};
