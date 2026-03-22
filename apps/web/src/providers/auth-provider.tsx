'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessToken } from '@/lib/auth';
import { usersApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLoading, login, logout } = useAuthStore();

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

  return <>{children}</>;
}
