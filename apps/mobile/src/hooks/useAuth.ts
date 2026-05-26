import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { registerDeviceForPush, unregisterDeviceForPush } from '@/lib/push';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, setUser, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth().then(async () => {
      if (useAuthStore.getState().isAuthenticated) {
        try {
          const { data } = await apiClient.get('/users/me');
          const userData = data.data || data;
          setUser(userData);
          // Fire-and-forget push registration; never block auth
          registerDeviceForPush().catch(() => {
            /* logged inside helper */
          });
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
      registerDeviceForPush().catch(() => {
        /* logged inside helper */
      });
      return result;
    },
    [login],
  );

  const handleLogout = useCallback(async () => {
    await unregisterDeviceForPush();
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
