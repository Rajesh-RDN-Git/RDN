import { apiClient } from '../api-client';
import type { IUser } from '@rdn/shared';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  sendOtp: (phone: string) => apiClient.post<{ message: string }>('/auth/send-otp', { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<AuthResponse>('/auth/verify-otp', { phone, otp }),

  refresh: (refreshToken: string) =>
    apiClient.post<RefreshResponse>('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout'),
};
