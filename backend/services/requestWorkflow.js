import ServiceRequest from '../models/ServiceRequest.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Conversation from '../models/Conversation.js';
import { notify } from './notifications.js';
import { emitUser } from './realtime.js';
import AppError from '../utils/AppError.js';

const stateLabel = s => s.toLowerCase().replaceAll('_', ' ');
export async function pushRequest(request, event = 'request:updated') {
  const populated = await ServiceRequest.findById(request._id).populate('category', 'name icon').populate('customer', 'name avatar phone').populate('provider', 'name avatar phone').lean();
  emitUser(populated.customer._id, event, populated);
  if (populated.provider?._id) emitUser(populated.provider._id, event, populated);
  return populated;
}
export async function setStatus(requestId, actor, nextStatus) {
  const current = await ServiceRequest.findById(requestId);
  if (!current) throw new AppError('Service request not found', 404);
  const providerStates = { ACCEPTED: 'PROVIDER_ON_THE_WAY', PROVIDER_ON_THE_WAY: 'STARTED', STARTED: 'COMPLETED' };
  if (actor.role === 'PROVIDER') {
    if (String(current.provider) !== String(actor._id)) throw new AppError('This job is not assigned to you', 403);
    if (providerStates[current.status] !== nextStatus) throw new AppError('That job status transition is not allowed', 409);
  } else if (actor.role === 'CUSTOMER') {
    if (String(current.customer) !== String(actor._id)) throw new AppError('This request does not belong to you', 403);
    if (nextStatus !== 'CANCELLED' || !['OPEN', 'ACCEPTED'].includes(current.status)) throw new AppError('This request can no longer be cancelled', 409);
  } else throw new AppError('You do not have permission to change this request', 403);
  const prior = current.status;
  const updated = await ServiceRequest.findOneAndUpdate({ _id: current._id, status: prior }, { $set: { status: nextStatus } }, { new: true });
  if (!updated) throw new AppError('The request changed while you were updating it. Refresh and try again.', 409);
  if (nextStatus === 'COMPLETED') await ProviderProfile.findOneAndUpdate({ user: current.provider }, { $inc: { completedJobs: 1 }, $set: { status: 'ONLINE' } });
  if (nextStatus === 'CANCELLED' && current.provider) await ProviderProfile.findOneAndUpdate({ user: current.provider, status: 'BUSY' }, { $set: { status: 'ONLINE' } });
  const body = `Your service request is now ${stateLabel(nextStatus)}.`;
  const type = nextStatus === 'COMPLETED' ? 'SERVICE_COMPLETED' : 'STATUS_CHANGED';
  for (const target of [current.customer, current.provider].filter(Boolean)) {
    if (String(target) !== String(actor._id)) await notify(target, { type, title: 'Request updated', body, actor: actor._id, request: current._id });
  }
  const result = await pushRequest(updated);
  if (nextStatus === 'COMPLETED') emitUser(current.provider, 'provider:stats:updated', { completed: true });
  return result;
}
export async function ensureConversation(request) {
  if (!request.provider) throw new AppError('Chat is available after a provider accepts the request', 409);
  return Conversation.findOneAndUpdate({ request: request._id }, { $setOnInsert: { request: request._id, participants: [request.customer, request.provider] } }, { new: true, upsert: true, setDefaultsOnInsert: true });
}
