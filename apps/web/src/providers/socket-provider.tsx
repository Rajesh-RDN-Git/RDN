'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { createChatSocket, createNotificationSocket } from '@/lib/socket';

interface SocketContextValue {
  chatSocket: Socket | null;
  notificationSocket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({
  chatSocket: null,
  notificationSocket: null,
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const chatRef = useRef<Socket | null>(null);
  const notifRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      chatRef.current = createChatSocket();
      notifRef.current = createNotificationSocket();

      chatRef.current.connect();
      notifRef.current.connect();

      return () => {
        chatRef.current?.disconnect();
        notifRef.current?.disconnect();
        chatRef.current = null;
        notifRef.current = null;
      };
    } else {
      chatRef.current?.disconnect();
      notifRef.current?.disconnect();
      chatRef.current = null;
      notifRef.current = null;
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider
      value={{ chatSocket: chatRef.current, notificationSocket: notifRef.current }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
