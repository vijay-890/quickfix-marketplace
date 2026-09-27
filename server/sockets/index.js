import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { assertConversationMember, persistMessage } from '../controllers/chatController.js';
import { setIO, emitAll, emitUser } from '../services/realtime.js';

export function configureSockets(io) {
  setIO(io);
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub);
      if (!user?.isActive) return next(new Error('Account unavailable'));
      socket.user = { _id: user._id, name: user.name, role: user.role };
      socket.data.user = { id: String(user._id), role: user.role };
      next();
    } catch { next(new Error('Invalid or expired session')); }
  });

  io.on('connection', socket => {
    const userId = String(socket.user._id);
    socket.join(`user:${userId}`);
    socket.on('presence:request', async (_data, acknowledge = () => {}) => {
      const activeSockets = await io.fetchSockets();
      const userIds = [...new Set(activeSockets.map(item => item.data?.user?.id).filter(Boolean))];
      acknowledge({ userIds });
    });

    socket.on('conversation:join', async (data, acknowledge = () => {}) => {
      try {
        const conversation = await assertConversationMember(data?.conversationId, socket.user);
        socket.join(`conversation:${conversation._id}`);
        acknowledge({ success: true, conversationId: String(conversation._id) });
      } catch (error) { acknowledge({ success: false, message: error.message }); }
    });

    socket.on('message:send', async (data, acknowledge = () => {}) => {
      try {
        if (!data?.conversationId || typeof data.content !== 'string' || !data.content.trim() || data.content.length > 2000) throw new Error('Message must be 1–2000 characters');
        const message = await persistMessage({ conversationId: data.conversationId, user: socket.user, content: data.content });
        acknowledge({ success: true, data: message });
      } catch (error) { acknowledge({ success: false, message: error.message || 'Could not send your message' }); }
    });

    socket.on('typing:start', async data => {
      try {
        const conversation = await assertConversationMember(data?.conversationId, socket.user);
        socket.to(`conversation:${conversation._id}`).emit('typing:update', { conversationId: String(conversation._id), user: socket.user, typing: true });
      } catch { /* unauthorized typing events are ignored */ }
    });
    socket.on('typing:stop', async data => {
      try {
        const conversation = await assertConversationMember(data?.conversationId, socket.user);
        socket.to(`conversation:${conversation._id}`).emit('typing:update', { conversationId: String(conversation._id), user: socket.user, typing: false });
      } catch { /* unauthorized typing events are ignored */ }
    });

    socket.on('messages:read', async data => {
      try {
        const conversation = await assertConversationMember(data?.conversationId, socket.user);
        const readAt = new Date();
        await Message.updateMany({ conversation: conversation._id, receiver: socket.user._id, readAt: null }, { $set: { readAt } });
        io.to(`conversation:${conversation._id}`).emit('messages:read', { conversationId: String(conversation._id), userId, readAt });
        emitUser(userId, 'messages:unread', { count: await Message.countDocuments({ receiver: socket.user._id, readAt: null }) });
      } catch { /* unauthorized read events are ignored */ }
    });

    socket.on('disconnect', async () => {
      const active = await io.in(`user:${userId}`).fetchSockets();
      if (active.length === 0) {
        const lastSeenAt = new Date();
        await User.updateOne({ _id: socket.user._id }, { $set: { lastSeenAt } });
        emitAll('user:presence', { userId, online: false, lastSeenAt });
      }
    });

    Promise.all([io.in(`user:${userId}`).fetchSockets(), Message.countDocuments({ receiver: socket.user._id, readAt: null }), io.fetchSockets()]).then(([sockets, unreadMessages, connectedSockets]) => {
      if (sockets.length === 1) emitAll('user:presence', { userId, online: true });
      socket.emit('messages:unread', { count: unreadMessages });
      socket.emit('presence:list', { userIds: [...new Set(connectedSockets.map(item => item.data?.user?.id).filter(Boolean))] });
    }).catch(error => console.error('Socket initialization failed:', error.message));
  });
  return io;
}
