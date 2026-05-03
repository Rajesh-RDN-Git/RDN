import { apiClient } from '../api-client';

export const societiesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    city?: string;
    state?: string;
    pincode?: string;
  }) => apiClient.get('/societies', { params }),

  getBySlug: (slug: string) => apiClient.get(`/societies/${slug}`),

  create: (data: Record<string, unknown>) => apiClient.post('/societies', data),

  update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/societies/${id}`, data),

  // SUPER_ADMIN only — assign or clear the RWA admin for a society.
  // Service-side promotes the user to RWA_ADMIN when needed.
  assignRwaAdmin: (id: string, rwaAdminId: string | null) =>
    apiClient.patch(`/societies/${id}`, { rwaAdminId }),

  // SUPER_ADMIN only — verify, flag, or reject a society.
  verify: (id: string, data: { status: 'VERIFIED' | 'FLAGGED' | 'REJECTED'; notes?: string }) =>
    apiClient.post(`/verification/society/${id}`, data),

  // SUPER_ADMIN only — list users that can be assigned as RWA admin.
  // Defaults to existing RWA admins; pass role=undefined for any user.
  getRwaCandidates: (params?: { role?: string; page?: number; limit?: number }) =>
    apiClient.get('/users', { params: { role: 'RWA_ADMIN', limit: 50, ...(params || {}) } }),
};
