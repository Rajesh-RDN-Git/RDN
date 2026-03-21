import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:4000';

export function createChatSocket(): Socket {
  return io(`${SOCKET_URL}/chat`, {
    auth: { token: getAccessToken() },
    transports: ['websocket'],
    autoConnect: false,
  });
}

export function createNotificationSocket(): Socket {
  return io(`${SOCKET_URL}/notifications`, {
    auth: { token: getAccessToken() },
    transports: ['websocket'],
    autoConnect: false,
  });
}
