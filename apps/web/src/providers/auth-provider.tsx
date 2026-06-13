'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getAccessToken, getRefreshToken } from '@/lib/auth';
import { usersApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLoading, login, logout } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      // Treat the user as logged in if EITHER token is present. The access cookie
      // expires after 15 min; when only the refresh token survives, getProfile
      // will 401 and the api-client interceptor silently refreshes, then retries.
      if (!getAccessToken() && !getRefreshToken()) {
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
