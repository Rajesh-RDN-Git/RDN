import { apiClient } from '../api-client';

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  channel: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    apiClient.get<NotificationListResponse>('/notifications', {
      params: {
        ...(params?.page !== undefined ? { page: params.page } : {}),
        ...(params?.limit !== undefined ? { limit: params.limit } : {}),
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
      },
    }),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.post('/notifications/read-all'),
};
