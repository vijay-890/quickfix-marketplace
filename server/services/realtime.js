let io;
export const setIO = value => { io = value; };
export const emitUser = (userId, event, payload) => io?.to(`user:${userId}`).emit(event, payload);
export const emitConversation = (conversationId, event, payload) => io?.to(`conversation:${conversationId}`).emit(event, payload);
export const emitAll = (event, payload) => io?.emit(event, payload);
export const getIO = () => io;
