import { apiClient } from '../api-client';
import type { IUser, UpdateUserInput } from '@rdn/shared';

export const usersApi = {
  getProfile: () => apiClient.get<IUser>('/users/me'),

  updateProfile: (data: UpdateUserInput) => apiClient.patch<IUser>('/users/me', data),

  listUsers: (params?: { page?: number; limit?: number; role?: string }) =>
    apiClient.get<{ data: IUser[]; total: number }>('/users', { params }),
};
