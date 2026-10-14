import Notification from '../models/Notification.js';
import { emitUser } from './realtime.js';
import { sendPush } from './webPush.js';

export async function notify(userId, values) {
  if (!userId) return null;
  const notification = await Notification.create({ user: userId, ...values });
  const payload = await Notification.findById(notification._id).populate('actor', 'name avatar').lean();
  emitUser(userId, 'notification:new', payload);
  const unreadCount = await Notification.countDocuments({ user: userId, readAt: null });
  emitUser(userId, 'notification:count', { count: unreadCount });
  const requestId = values.request ? String(values.request._id || values.request) : '';
  const conversationId = values.conversation ? String(values.conversation._id || values.conversation) : '';
  const path = conversationId ? `/inbox?conversation=${encodeURIComponent(conversationId)}` : requestId ? `/requests/${encodeURIComponent(requestId)}` : '/notifications';
  void sendPush(userId, { title: values.title, body: values.body, path, tag: `quickfix-${values.type || 'update'}` }).catch(() => {});
  return payload;
}
