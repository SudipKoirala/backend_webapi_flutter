import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import User from '../models/user.model';

type JwtPayload = {
  id: string;
  role: string;
};

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const userSockets = new Map<string, Set<string>>();
let io: Server | null = null;

const getTokenFromSocket = (socket: Socket) => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

const trackSocketForUser = (userId: string, socketId: string) => {
  const set = userSockets.get(userId) || new Set<string>();
  set.add(socketId);
  userSockets.set(userId, set);
};

const untrackSocketForUser = (userId: string, socketId: string) => {
  const set = userSockets.get(userId);
  if (!set) return 0;

  set.delete(socketId);
  if (set.size === 0) {
    userSockets.delete(userId);
    return 0;
  }

  return set.size;
};

const formatPresence = (userId: string, isOnline: boolean, lastSeenAt?: Date | null) => ({
  userId,
  isOnline,
  lastSeenAt: lastSeenAt ? lastSeenAt.toISOString() : null,
});

export const initChatGateway = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      (socket.data as { userId?: string }).userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = (socket.data as { userId: string }).userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    trackSocketForUser(userId, socket.id);
    socket.join(`user:${userId}`);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeenAt: null,
    });

    io?.emit('presence:update', formatPresence(userId, true, null));

    socket.on('disconnect', async () => {
      const remaining = untrackSocketForUser(userId, socket.id);
      if (remaining > 0) return;

      const now = new Date();
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeenAt: now,
      });

      io?.emit('presence:update', formatPresence(userId, false, now));
    });
  });

  return io;
};

export const getChatIO = () => io;

export const emitMessageToUsers = (userIds: string[], payload: unknown) => {
  if (!io) return;
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit('message:new', payload);
  }
};

export const emitConversationUpdateToUsers = (userIds: string[], payload: unknown) => {
  if (!io) return;
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit('conversation:update', payload);
  }
};
