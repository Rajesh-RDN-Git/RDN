import { apiClient } from '../api-client';

export const notificationsApi = {
  list: (params?: Record<string, string>) => apiClient.get('/notifications', { params }),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};
