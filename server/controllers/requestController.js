import ServiceRequest from '../models/ServiceRequest.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { ensureConversation, pushRequest, setStatus } from '../services/requestWorkflow.js';
import { notify } from '../services/notifications.js';
import { emitUser } from '../services/realtime.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import escapeRegex from '../utils/escapeRegex.js';

const pageOf = req => ({ page: Math.max(1, Number(req.query.page) || 1), limit: Math.min(50, Math.max(1, Number(req.query.limit) || 10)) });
const populated = query => query.populate('category', 'name icon slug').populate('customer', 'name avatar phone').populate('provider', 'name avatar phone');

export const create = asyncHandler(async (req, res) => {
  const category = await ServiceCategory.findOne({ _id: req.body.category, isActive: true });
  if (!category) throw new AppError('Choose an active service category', 400);
  const request = await ServiceRequest.create({ customer: req.user._id, category: category._id, title: req.body.title, description: req.body.description, budget: req.body.budget, address: req.body.address, city: req.body.city || '', mapLocation: req.body.mapLocation || undefined, preferredDate: req.body.preferredDate || null });
  const match = { status: 'ONLINE', categories: category._id };
  const profiles = await ProviderProfile.find(match).select('user').lean();
  for (const provider of profiles) await notify(provider.user, { type: 'REQUEST_CREATED', title: 'A new job is available', body: `${category.name}: ${request.title}`, actor: req.user._id, request: request._id });
  emitUser(req.user._id, 'dashboard:refresh', { resource: 'requests' });
  ok(res, await populated(ServiceRequest.findById(request._id)).lean(), 'Request posted — we are finding a local pro', 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit } = pageOf(req);
  const filter = {};
  if (req.user.role === 'CUSTOMER') filter.customer = req.user._id;
  if (req.user.role === 'PROVIDER') {
    const profile = await ProviderProfile.findOne({ user: req.user._id }).select('categories');
    const scope = req.query.scope || 'incoming';
    if (scope === 'incoming') {
      filter.status = 'OPEN';
      if (profile?.categories?.length) filter.category = { $in: profile.categories };
      else filter.category = { $in: [] };
    } else filter.provider = req.user._id;
  }
  if (req.user.role === 'ADMIN') {
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.location) filter.city = { $regex: escapeRegex(req.query.location, 100), $options: 'i' };
  }
  if (req.user.role === 'CUSTOMER' && req.query.status) filter.status = req.query.status;
  if (req.user.role === 'PROVIDER' && (req.query.scope || 'incoming') !== 'incoming' && req.query.status) filter.status = req.query.status;
  if (req.query.category && req.user.role !== 'ADMIN') filter.category = req.query.category;
  const [items, total] = await Promise.all([
    populated(ServiceRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)).lean(), ServiceRequest.countDocuments(filter)
  ]);
  if (req.user.role === 'PROVIDER' && filter.status === 'OPEN') {
    for (const item of items) { item.address = 'Shared after you accept'; item.mapLocation = null; if (item.customer) delete item.customer.phone; }
  }
  ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const detail = asyncHandler(async (req, res) => {
  const row = await populated(ServiceRequest.findById(req.params.id)).lean();
  if (!row) throw new AppError('Service request not found', 404);
  const matchedProvider = req.user.role === 'PROVIDER' && row.status === 'OPEN'
    ? await ProviderProfile.exists({ user: req.user._id, categories: row.category._id }) : false;
  const allowed = req.user.role === 'ADMIN' || String(row.customer._id) === String(req.user._id) || String(row.provider?._id) === String(req.user._id) || matchedProvider;
  if (!allowed) throw new AppError('You do not have access to this request', 403);
  if (matchedProvider) { row.address = 'Shared after you accept'; row.mapLocation = null; if (row.customer) delete row.customer.phone; }
  const review = row.status === 'COMPLETED' ? await import('../models/Review.js').then(({ default: Review }) => Review.findOne({ request: row._id }).lean()) : null;
  ok(res, { ...row, review });
});

export const accept = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new AppError('Service request not found', 404);
  const profile = await ProviderProfile.findOneAndUpdate({ user: req.user._id, status: 'ONLINE', categories: request.category }, { $set: { status: 'BUSY' } }, { new: true });
  if (!profile) throw new AppError('Set yourself online and add this service category to your profile to accept it', 409);
  const assigned = await ServiceRequest.findOneAndUpdate({ _id: request._id, status: 'OPEN', provider: null }, { $set: { status: 'ACCEPTED', provider: req.user._id } }, { new: true });
  if (!assigned) {
    profile.status = 'ONLINE'; await profile.save();
    throw new AppError('This request is no longer available', 409);
  }
  await ensureConversation(assigned);
  await notify(assigned.customer, { type: 'REQUEST_ACCEPTED', title: 'Your pro is on the job', body: `${req.user.name} accepted “${assigned.title}”.`, actor: req.user._id, request: assigned._id });
  const result = await pushRequest(assigned);
  emitUser(req.user._id, 'dashboard:refresh', { resource: 'jobs' });
  ok(res, result, 'Request accepted — the customer has been notified');
});

export const reject = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id, status: 'ONLINE' }).select('categories');
  if (!profile) throw new AppError('Go online before passing on job requests', 409);
  const request = await ServiceRequest.findOne({ _id: req.params.id, status: 'OPEN' });
  if (!request) throw new AppError('This request is no longer available', 409);
  if (!profile.categories.some(category => String(category) === String(request.category))) throw new AppError('This request is outside your service categories', 403);
  await ServiceRequest.updateOne({ _id: request._id }, { $inc: { rejectionCount: 1 } });
  await notify(request.customer, { type: 'REQUEST_REJECTED', title: 'Pro unavailable', body: `${req.user.name} can’t take “${request.title}”. Other pros can still accept it.`, actor: req.user._id, request: request._id });
  emitUser(req.user._id, 'dashboard:refresh', { resource: 'requests' });
  ok(res, { requestId: request._id }, 'Request passed to another pro');
});

export const updateStatus = asyncHandler(async (req, res) => ok(res, await setStatus(req.params.id, req.user, req.body.status), 'Request status updated'));
export const cancel = asyncHandler(async (req, res) => ok(res, await setStatus(req.params.id, req.user, 'CANCELLED'), 'Request cancelled'));

export const chatForRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new AppError('Service request not found', 404);
  if (![String(request.customer), String(request.provider)].includes(String(req.user._id))) throw new AppError('You do not have access to this request', 403);
  const conversation = await ensureConversation(request);
  ok(res, conversation);
});
