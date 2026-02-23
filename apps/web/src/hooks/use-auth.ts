'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authApi, usersApi } from '@/lib/api';
import { setTokens, clearTokens } from '@/lib/auth';

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const login = useCallback(async (phone: string, otp: string) => {
    const { data } = await authApi.verifyOtp(phone, otp);
    setTokens(data.accessToken, data.refreshToken);
    useAuthStore.getState().login(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearTokens();
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await usersApi.getProfile();
      useAuthStore.getState().setUser(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  return { user, isAuthenticated, isLoading, login, logout, refreshProfile };
}
