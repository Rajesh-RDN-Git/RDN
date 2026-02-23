import { apiClient } from '../api-client';

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number }) => apiClient.get('/notifications', { params }),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch('/notifications/read-all'),

  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
};
