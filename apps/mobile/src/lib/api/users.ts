import { apiClient } from '../api-client';

export const usersApi = {
  me: () => apiClient.get('/users/me'),
  updateMe: (data: { name?: string; email?: string; avatarUrl?: string }) =>
    apiClient.patch('/users/me', data),
};
