import Review from '../models/Review.js';
import ServiceRequest from '../models/ServiceRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { notify } from '../services/notifications.js';
import { emitUser } from '../services/realtime.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
export const create = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findOne({ _id: req.body.request, customer: req.user._id, status: 'COMPLETED', provider: { $ne: null } });
  if (!request) throw new AppError('Only completed jobs you booked can be reviewed', 409);
  const review = await Review.create({ request: request._id, customer: req.user._id, provider: request.provider, rating: req.body.rating, comment: req.body.comment || '' });
  const [stats] = await Review.aggregate([{ $match: { provider: request.provider } }, { $group: { _id: '$provider', average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  await ProviderProfile.findOneAndUpdate({ user: request.provider }, { $set: { ratingAverage: Math.round(stats.average * 10) / 10, ratingCount: stats.count } });
  await notify(request.provider, { type: 'NEW_REVIEW', title: 'A customer reviewed your work', body: `${req.user.name} left you a ${req.body.rating}-star review.`, actor: req.user._id, request: request._id });
  emitUser(request.provider, 'provider:stats:updated', { review: true });
  ok(res, await Review.findById(review._id).populate('customer', 'name avatar').lean(), 'Thank you for sharing your experience', 201);
});
export const list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  if (req.user.role === 'PROVIDER') filter.provider = req.user._id;
  if (req.user.role === 'ADMIN' && req.query.provider) filter.provider = req.query.provider;
  const items = await Review.find(filter).populate('customer', 'name avatar').populate('provider', 'name avatar').populate('request', 'title category').sort({ createdAt: -1 }).lean();
  ok(res, items);
});
