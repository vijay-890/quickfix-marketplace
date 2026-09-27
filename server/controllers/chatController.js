import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { notify } from '../services/notifications.js';
import { emitConversation, emitUser } from '../services/realtime.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

async function conversationFor(id, user) {
  const conversation = await Conversation.findById(id).populate('participants', 'name avatar role').populate('request', 'title status');
  if (!conversation) throw new AppError('Conversation not found', 404);
  if (!conversation.participants.some(p => String(p._id) === String(user._id))) throw new AppError('You do not have access to this conversation', 403);
  return conversation;
}

export const list = asyncHandler(async (req, res) => {
  const rows = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1 }).populate('participants', 'name avatar role').populate('request', 'title status').populate({ path: 'lastMessage', select: 'content sender createdAt readAt' }).lean();
  const unread = await Message.aggregate([{ $match: { receiver: req.user._id, readAt: null } }, { $group: { _id: '$conversation', count: { $sum: 1 } } }]);
  const counts = new Map(unread.map(x => [String(x._id), x.count]));
  ok(res, rows.map(c => ({ ...c, unreadCount: counts.get(String(c._id)) || 0 })));
});

export const history = asyncHandler(async (req, res) => {
  await conversationFor(req.params.id, req.user);
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(100, Number(req.query.limit) || 50);
  const [items, total] = await Promise.all([Message.find({ conversation: req.params.id }).populate('sender', 'name avatar').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Message.countDocuments({ conversation: req.params.id })]);
  ok(res, { items: items.reverse(), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export async function persistMessage({ conversationId, user, content }) {
  const conversation = await conversationFor(conversationId, user);
  const senderId = String(user._id);
  const receiver = conversation.participants.find(p => String(p._id) !== senderId);
  if (!receiver) throw new AppError('Conversation has no other participant', 409);
  const message = await Message.create({ conversation: conversation._id, sender: user._id, receiver: receiver._id, content: String(content || '').trim() });
  await Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessage: message._id, lastMessageAt: message.createdAt } });
  const payload = await Message.findById(message._id).populate('sender', 'name avatar').lean();
  emitConversation(conversation._id, 'message:received', payload);
  emitUser(receiver._id, 'dashboard:refresh', { resource: 'messages' });
  await notify(receiver._id, { type: 'NEW_MESSAGE', title: `Message from ${user.name}`, body: `You have a new message about ${conversation.request.title}.`, actor: user._id, request: conversation.request._id, conversation: conversation._id });
  return payload;
}

export const send = asyncHandler(async (req, res) => {
  const message = await persistMessage({ conversationId: req.params.id, user: req.user, content: req.body.content });
  ok(res, message, 'Message sent', 201);
});

export const markRead = asyncHandler(async (req, res) => {
  const conversation = await conversationFor(req.params.id, req.user);
  const now = new Date();
  const result = await Message.updateMany({ conversation: conversation._id, receiver: req.user._id, readAt: null }, { $set: { readAt: now } });
  emitConversation(conversation._id, 'messages:read', { userId: String(req.user._id), readAt: now });
  emitUser(req.user._id, 'messages:unread', { count: await Message.countDocuments({ receiver: req.user._id, readAt: null }) });
  ok(res, { updated: result.modifiedCount });
});

export async function assertConversationMember(conversationId, user) { return conversationFor(conversationId, user); }
