import { apiClient } from '../api-client';

export const usersApi = {
  me: () => apiClient.get('/users/me'),
  updateMe: (data: { name?: string; email?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', data),

  // SUPER_ADMIN: list all users (search + role/status filters).
  list: (params?: Record<string, string>) => apiClient.get('/admin/users', { params }),
  getById: (id: string) => apiClient.get(`/users/${id}`),

  // SUPER_ADMIN: set a standalone role (SUPER_ADMIN / OWNER / BUYER_TENANT).
  updateRole: (id: string, role: string) => apiClient.patch(`/admin/users/${id}/role`, { role }),
};
