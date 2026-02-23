'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessToken } from '@/lib/auth';
import { usersApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading, setLoading, login, logout } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await usersApi.getProfile();
        login(data);
      } catch {
        logout();
      }
    }
    hydrate();
  }, [login, logout, setLoading]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
