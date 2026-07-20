import { apiClient } from '../api-client';
import type { IUser, UpdateUserInput } from '@rdn/shared';

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { ownedProperties: number; buyerLeads: number; filedGrievances: number };
}

export const usersApi = {
  getProfile: () => apiClient.get<IUser>('/users/me'),

  updateProfile: (data: UpdateUserInput) => apiClient.patch<IUser>('/users/me', data),

  listUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<{ data: IUser[]; total: number }>('/users', { params }),

  // SUPER_ADMIN: richer list (search + phone blind-index + counts).
  adminListUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) =>
    apiClient.get<{ data: AdminUser[]; total: number; page: number; limit: number }>(
      '/admin/users',
      { params },
    ),

  // SUPER_ADMIN: set a standalone role (SUPER_ADMIN / OWNER / BUYER_TENANT).
  updateRole: (id: string, role: string) =>
    apiClient.patch<IUser>(`/admin/users/${id}/role`, { role }),

  // Self-service account deletion (DPDP erasure — soft-delete + PII scrub, throttled 3/hr).
  deleteAccount: () => apiClient.delete('/users/me'),
};
