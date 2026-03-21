import { apiClient } from '../api-client';

export const authApi = {
  sendOtp: (phone: string) =>
    apiClient.post<{ data: { message: string } }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) => apiClient.post('/auth/verify-otp', { phone, otp }),

  refresh: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout'),

  getProfile: () => apiClient.get('/users/me'),
};
