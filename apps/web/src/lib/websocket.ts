'use client';

import { io, Socket } from 'socket.io-client';
import { resolveRuntimeBaseUrl } from './runtime-base-url';

function getWsUrl() {
  return resolveRuntimeBaseUrl(process.env.NEXT_PUBLIC_WS_URL, 'http://localhost:3001');
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getWsUrl(), {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      auth: {
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
      },
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) socket.disconnect();
}
