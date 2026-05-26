import { apiClient } from '../api-client';

export type DevicePlatform = 'IOS' | 'ANDROID';

export const notificationsApi = {
  list: (params?: Record<string, string>) => apiClient.get('/notifications', { params }),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.post('/notifications/read-all'),

  registerDeviceToken: (token: string, platform: DevicePlatform, appVersion?: string) =>
    apiClient.post('/notifications/device-token', { token, platform, appVersion }),

  unregisterDeviceToken: (token: string) =>
    apiClient.delete(`/notifications/device-token/${encodeURIComponent(token)}`),
};
