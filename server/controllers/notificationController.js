import Notification from '../models/Notification.js';
import UserPushSubscription from '../models/UserPushSubscription.js';
import { getPublicPushKey } from '../services/webPush.js';
import { emitUser } from '../services/realtime.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
const unread = user => Notification.countDocuments({ user, readAt: null });
export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Number(req.query.limit) || 20);
  const [items, total, count] = await Promise.all([Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actor', 'name avatar').populate('request', 'title status').lean(), Notification.countDocuments({ user: req.user._id }), unread(req.user._id)]);
  ok(res, { items, unreadCount: count, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const count = asyncHandler(async (req, res) => ok(res, { unreadCount: await unread(req.user._id) }));
export const readOne = asyncHandler(async (req, res) => {
  const row = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: { readAt: new Date() } }, { new: true });
  if (!row) throw new AppError('Notification not found', 404);
  const unreadCount = await unread(req.user._id); emitUser(req.user._id, 'notification:count', { count: unreadCount });
  ok(res, { notification: row, unreadCount });
});
export const readAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
  emitUser(req.user._id, 'notification:count', { count: 0 });
  ok(res, { unreadCount: 0 }, 'All caught up');
});
export const pushPublicKey = asyncHandler(async (_req, res) => ok(res, { publicKey: getPublicPushKey() }));
export const pushSubscriptionStatus = asyncHandler(async (req, res) => {
  const subscribed = await UserPushSubscription.exists({ user: req.user._id, endpoint: req.body.endpoint });
  ok(res, { subscribed: Boolean(subscribed) });
});
export const savePushSubscription = asyncHandler(async (req, res) => {
  const { endpoint, expirationTime = null, keys } = req.body;
  await UserPushSubscription.findOneAndUpdate({ endpoint }, { $set: { user: req.user._id, endpoint, expirationTime, keys } }, { upsert: true, new: true, runValidators: true });
  ok(res, { subscribed: true }, 'Push notifications enabled', 201);
});
export const removePushSubscription = asyncHandler(async (req, res) => {
  await UserPushSubscription.deleteOne({ user: req.user._id, endpoint: req.body.endpoint });
  ok(res, { subscribed: false }, 'Push notifications disabled');
});
