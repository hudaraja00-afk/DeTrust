import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import { config } from './index';

let io: SocketServer | null = null;

/**
 * Parse cookies from a raw Cookie header string.
 * Avoids an extra dependency on the `cookie` package.
 */
function parseCookies(header: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx < 0) return;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

export function initSocketIO(httpServer: HttpServer): SocketServer {
  const origins = config.isDev
    ? [config.server.frontendUrl, 'http://localhost:3000', 'http://localhost:3001']
    : [config.server.frontendUrl];

  io = new SocketServer(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
    },
    path: '/ws',
  });

  // Authenticate every incoming socket via the same JWT cookie / auth token
  // used by the REST API.
  io.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || '');
      const token =
        cookies['detrust-auth-token'] || (socket.handshake.auth?.token as string | undefined);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      (socket as any).userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId: string | undefined = (socket as any).userId;
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {
      // Room cleanup is handled automatically by socket.io
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}
