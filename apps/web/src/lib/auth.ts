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
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: 1 / 96, // 15 minutes
  });
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: 30, // 30 days
  });
}

export function clearTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
}
