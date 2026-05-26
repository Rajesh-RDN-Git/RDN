import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/secure-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:4000';

const COMMON_OPTS = {
  autoConnect: false,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  timeout: 10000,
};

function authProvider(cb: (data: { token: string | null }) => void) {
  getAccessToken()
    .then((token) => cb({ token }))
    .catch(() => cb({ token: null }));
}

export function createChatSocket(): Socket {
  return io(`${BASE_URL}/chat`, {
    ...COMMON_OPTS,
    auth: authProvider as unknown as Record<string, unknown>,
  });
}

export function createNotificationSocket(): Socket {
  return io(`${BASE_URL}/notifications`, {
    ...COMMON_OPTS,
    auth: authProvider as unknown as Record<string, unknown>,
  });
}
