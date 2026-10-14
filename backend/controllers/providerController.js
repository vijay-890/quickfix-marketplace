import ProviderProfile from '../models/ProviderProfile.js';
import Review from '../models/Review.js';
import { emitAll } from '../services/realtime.js';
import { notify } from '../services/notifications.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import escapeRegex from '../utils/escapeRegex.js';
export const search = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1), limit = Math.min(30, Math.max(1, Number(req.query.limit) || 12));
  const filter = { status: req.query.available === 'false' ? { $in: ['ONLINE', 'OFFLINE'] } : 'ONLINE' };
  if (req.query.category) filter.categories = req.query.category;
  if (req.query.location) filter.serviceArea = { $regex: escapeRegex(req.query.location, 100), $options: 'i' };
  if (req.query.rating) filter.ratingAverage = { $gte: Number(req.query.rating) };
  if (req.query.minRate || req.query.maxRate) filter.hourlyRate = { ...(req.query.minRate ? { $gte: Number(req.query.minRate) } : {}), ...(req.query.maxRate ? { $lte: Number(req.query.maxRate) } : {}) };
  const [rows, total] = await Promise.all([
    ProviderProfile.find(filter).populate('user', 'name avatar').populate('categories', 'name icon slug').sort({ ratingAverage: -1, completedJobs: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ProviderProfile.countDocuments(filter)
  ]);
  ok(res, { items: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});
export const list = asyncHandler(async (_req, res) => ok(res, await ProviderProfile.find().populate('user', 'name email phone avatar isActive').populate('categories', 'name icon').sort({ updatedAt: -1 }).lean()));
export const detail = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.params.id }).populate('user', 'name avatar isActive').populate('categories', 'name icon slug').lean();
  if (!profile || !profile.user?.isActive) throw new AppError('Service professional not found', 404);
  const [reviews, count] = await Promise.all([
    Review.find({ provider: req.params.id }).populate('customer', 'name avatar').populate('request', 'title').sort({ createdAt: -1 }).limit(30).lean(),
    Review.countDocuments({ provider: req.params.id })
  ]);
  ok(res, { profile, reviews, totalReviews: count });
});
export const mine = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id }).populate('categories', 'name icon slug');
  if (!profile) throw new AppError('Provider profile not found', 404);
  ok(res, profile);
});
export const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['ONLINE', 'OFFLINE'].includes(status)) throw new AppError('Choose online or offline', 400);
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new AppError('Provider profile not found', 404);
  if (profile.status === 'BUSY') throw new AppError('Your availability will return to online when your active job is complete', 409);
  profile.status = status;
  await profile.save();
  emitAll('provider:presence', { userId: String(req.user._id), status });
  await notify(req.user._id, { type: 'PROVIDER_STATUS', title: `You are ${status.toLowerCase()}`, body: status === 'ONLINE' ? 'You can now receive matching jobs.' : 'You will not receive new job offers.' });
  ok(res, profile, `You are now ${status.toLowerCase()}`);
});
export const reviews = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.params.id });
  if (!profile) throw new AppError('Provider not found', 404);
  const items = await Review.find({ provider: req.params.id }).populate('customer', 'name avatar').populate('request', 'title category').sort({ createdAt: -1 }).lean();
  ok(res, { items, average: profile.ratingAverage, count: profile.ratingCount });
});
