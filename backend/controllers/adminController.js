import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceRequest from '../models/ServiceRequest.js';
import ServiceCategory from '../models/ServiceCategory.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import escapeRegex from '../utils/escapeRegex.js';
import { emitAll, getIO } from '../services/realtime.js';

export const overview = asyncHandler(async (_req, res) => {
  const [users, customers, providers, onlineProviders, openRequests, activeJobs, completedJobs, categories, reviews, recentRequests] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'CUSTOMER' }), User.countDocuments({ role: 'PROVIDER' }), ProviderProfile.countDocuments({ status: 'ONLINE' }),
    ServiceRequest.countDocuments({ status: 'OPEN' }), ServiceRequest.countDocuments({ status: { $in: ['ACCEPTED', 'PROVIDER_ON_THE_WAY', 'STARTED'] } }),
    ServiceRequest.countDocuments({ status: 'COMPLETED' }), ServiceCategory.countDocuments({ isActive: true }), Review.countDocuments(),
    ServiceRequest.find().sort({ createdAt: -1 }).limit(8).populate('customer', 'name').populate('provider', 'name').populate('category', 'name icon').lean()
  ]);
  ok(res, { metrics: { users, customers, providers, onlineProviders, openRequests, activeJobs, completedJobs, categories, reviews }, recentRequests });
});

export const users = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) { const search = escapeRegex(req.query.search, 100); filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]; }
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), User.countDocuments(filter)]);
  ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const setUserActive = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw new AppError('You cannot disable your own admin account', 409);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive: req.body.isActive } }, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  if (!user.isActive) {
    if (user.role === 'PROVIDER') await ProviderProfile.updateOne({ user: user._id }, { $set: { status: 'OFFLINE' } });
    getIO()?.in(`user:${user._id}`).disconnectSockets(true);
    emitAll('user:presence', { userId: String(user._id), online: false });
  }
  ok(res, user, user.isActive ? 'Account enabled' : 'Account disabled');
});

export const requests = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) { const search = escapeRegex(req.query.search, 120); filter.$or = [{ title: { $regex: search, $options: 'i' } }, { city: { $regex: search, $options: 'i' } }]; }
  const [items, total] = await Promise.all([ServiceRequest.find(filter).populate('customer', 'name email').populate('provider', 'name email').populate('category', 'name icon').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), ServiceRequest.countDocuments(filter)]);
  ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const activity = asyncHandler(async (_req, res) => {
  const items = await Notification.find().sort({ createdAt: -1 }).limit(50).populate('user', 'name role').populate('actor', 'name').populate('request', 'title').lean();
  ok(res, items.map(item => item.type === 'NEW_MESSAGE' ? { ...item, body: 'A participant received a new chat message.' } : item));
});
