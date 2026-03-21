import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setUser, setLoading, checkAuth } =
    useAuthStore();

  useEffect(() => {
    checkAuth().then(async () => {
      if (useAuthStore.getState().isAuthenticated) {
        try {
          const { data } = await apiClient.get('/users/me');
          const userData = data.data || data;
          setUser(userData);
        } catch {
          await logout();
        }
      }
    });
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const { data } = await apiClient.post('/auth/send-otp', { phone });
    return data.data || data;
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, otp: string) => {
      const { data } = await apiClient.post('/auth/verify-otp', { phone, otp });
      const result = data.data || data;
      await login(result.user, result.accessToken, result.refreshToken);
      return result;
    },
    [login],
  );

  const handleLogout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    await logout();
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    sendOtp,
    verifyOtp,
    logout: handleLogout,
  };
}
