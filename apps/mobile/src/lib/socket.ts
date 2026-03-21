import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/secure-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:4000';

export function createChatSocket(): Socket {
  return io(`${BASE_URL}/chat`, {
    autoConnect: false,
    transports: ['websocket'],
    auth: async (cb) => {
      const token = await getAccessToken();
      cb({ token });
    },
  });
}

export function createNotificationSocket(): Socket {
  return io(`${BASE_URL}/notifications`, {
    autoConnect: false,
    transports: ['websocket'],
    auth: async (cb) => {
      const token = await getAccessToken();
      cb({ token });
    },
  });
}
