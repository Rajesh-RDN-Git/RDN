import Cookies from 'js-cookie';

const ACCESS_TOKEN_KEY = 'rdn_access_token';
const REFRESH_TOKEN_KEY = 'rdn_refresh_token';

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  // Mark cookies secure only when actually served over HTTPS. Keying off
  // NODE_ENV broke a local production build over http://localhost: the browser
  // silently drops `secure` cookies on plain HTTP, so login never persisted and
  // every /dashboard route bounced to /login. Production (HTTPS) still gets secure.
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    sameSite: 'strict',
    secure,
    expires: 1 / 96, // 15 minutes
  });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    sameSite: 'strict',
    secure,
    expires: 30, // 30 days
  });
}

export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}
