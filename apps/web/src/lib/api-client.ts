import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './auth';
import { loginRedirectFor } from './routes';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the TransformInterceptor { data, meta } envelope
    if (
      response.data &&
      typeof response.data === 'object' &&
      'meta' in response.data &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Attempt a token refresh only when the user is genuinely logged in — i.e. a
    // refresh token exists. The access-token cookie expires after 15 min, after
    // which requests go out with no Authorization header and the API 401s; we
    // must still refresh in that case. Anonymous/optional calls from public pages
    // have no refresh token and reject quietly so the caller's own catch can fall
    // back — never hijack the whole page with a redirect to /login.
    const refreshToken = getRefreshToken();
    if (error.response?.status !== 401 || originalRequest._retry || !refreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
        refreshToken,
      });
      const refreshData = res.data?.data ?? res.data;
      setTokens(refreshData.accessToken, refreshData.refreshToken);
      processQueue(null, refreshData.accessToken);
      originalRequest.headers.Authorization = `Bearer ${refreshData.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Only treat an EXPLICIT auth rejection from /auth/refresh as a real logout.
      // The refresh token is a 30-day cookie; a transient failure (no response,
      // network blip, timeout, or 5xx) must NOT nuke a still-valid session or bounce
      // the page to /login — that was the spurious-logout bug. Reject quietly and let
      // the caller's catch (and hydration retry) recover on the next request.
      const status = (refreshError as AxiosError).response?.status;
      if (status === 401 || status === 403) {
        clearTokens();
        // The session is genuinely dead — but only bounce to /login from a protected
        // route. On public pages (a property, search, a society) let the page render as
        // a guest instead of ejecting a browsing user. This was the recurring
        // "clicked a property → login" bug after a redeploy invalidated the cookie.
        if (typeof window !== 'undefined') {
          const target = loginRedirectFor(window.location.pathname);
          if (target) window.location.href = target;
        }
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
