import { Router } from 'express';
import { body, param } from 'express-validator';
import { register, login, me, updateMe } from '../controllers/authController.js';
import * as categories from '../controllers/categoryController.js';
import * as providers from '../controllers/providerController.js';
import * as requests from '../controllers/requestController.js';
import * as chat from '../controllers/chatController.js';
import * as notifications from '../controllers/notificationController.js';
import * as reviews from '../controllers/reviewController.js';
import * as admin from '../controllers/adminController.js';
import { avatar, requestImages, imageUpload, verifyImageContent } from '../controllers/uploadController.js';
import { protect, allowRoles } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import ProviderProfile from '../models/ProviderProfile.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import ServiceRequest from '../models/ServiceRequest.js';

const router = Router();
const id = param('id').isMongoId().withMessage('Invalid identifier');
const nameRule = body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters');
const emailRule = body('email').trim().isEmail().normalizeEmail().withMessage('Enter a valid email');
const passwordRule = body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be at least 8 characters');

router.get('/health', asyncHandler(async (_req, res) => ok(res, { status: 'ok', database: 'connected' })));
router.post('/auth/register', [nameRule, emailRule, passwordRule, body('role').optional().isIn(['CUSTOMER', 'PROVIDER', 'customer', 'provider']).withMessage('Choose customer or provider'), validate], register);
router.post('/auth/login', [emailRule, body('password').notEmpty().withMessage('Password is required'), validate], login);
router.get('/auth/me', protect, me);
router.patch('/users/me', protect, [body('name').optional().trim().isLength({ min: 2, max: 80 }), body('phone').optional().trim().isLength({ max: 24 }), body('bio').optional().trim().isLength({ max: 700 }), body('hourlyRate').optional().isFloat({ min: 0, max: 100000 }), body('experienceYears').optional().isInt({ min: 0, max: 60 }), body('serviceArea').optional().trim().isLength({ max: 120 }), validate], updateMe);
router.post('/uploads/avatar', protect, imageUpload.single('image'), verifyImageContent, avatar);
router.get('/services', categories.list);
router.get('/providers', providers.search);
router.get('/providers/me', protect, allowRoles('PROVIDER'), providers.mine);
router.patch('/providers/me/status', protect, allowRoles('PROVIDER'), [body('status').isIn(['ONLINE', 'OFFLINE']).withMessage('Status must be ONLINE or OFFLINE'), validate], providers.setStatus);
router.get('/providers/:id', [id, validate], providers.detail);
router.get('/providers/:id/reviews', [id, validate], providers.reviews);
router.post('/requests', protect, allowRoles('CUSTOMER'), [body('category').isMongoId(), body('title').trim().isLength({ min: 4, max: 100 }), body('description').trim().isLength({ min: 10, max: 1800 }), body('budget').isFloat({ min: 1, max: 1000000 }), body('address').trim().isLength({ min: 4, max: 240 }), body('city').optional().trim().isLength({ max: 100 }), body('mapLocation').optional({ nullable: true }).custom(value => { if (value && ((value.latitude == null) !== (value.longitude == null))) throw new Error('Share both map coordinates'); return true; }), body('mapLocation.latitude').optional().isFloat({ min: -90, max: 90 }), body('mapLocation.longitude').optional().isFloat({ min: -180, max: 180 }), body('preferredDate').optional().isISO8601().withMessage('Preferred date must be a valid date'), validate], requests.create);
router.get('/requests', protect, requests.list);
router.get('/requests/:id', protect, [id, validate], requests.detail);
router.post('/requests/:id/accept', protect, allowRoles('PROVIDER'), [id, validate], requests.accept);
router.post('/requests/:id/reject', protect, allowRoles('PROVIDER'), [id, validate], requests.reject);
router.patch('/requests/:id/status', protect, allowRoles('PROVIDER'), [id, body('status').isIn(['PROVIDER_ON_THE_WAY', 'STARTED', 'COMPLETED']), validate], requests.updateStatus);
router.post('/requests/:id/cancel', protect, allowRoles('CUSTOMER'), [id, validate], requests.cancel);
router.post('/requests/:id/images', protect, imageUpload.array('images', 4), verifyImageContent, requestImages);
router.get('/requests/:id/conversation', protect, [id, validate], requests.chatForRequest);
router.get('/conversations', protect, chat.list);
router.get('/conversations/:id/messages', protect, [id, validate], chat.history);
router.post('/conversations/:id/messages', protect, allowRoles('CUSTOMER', 'PROVIDER'), [id, body('content').trim().isLength({ min: 1, max: 2000 }), validate], chat.send);
router.post('/conversations/:id/read', protect, [id, validate], chat.markRead);
router.get('/notifications', protect, notifications.list);
router.get('/notifications/count', protect, notifications.count);
router.patch('/notifications/read-all', protect, notifications.readAll);
router.patch('/notifications/:id/read', protect, [id, validate], notifications.readOne);
router.get('/notifications/push/public-key', notifications.pushPublicKey);
router.post('/notifications/push/subscriptions/status', protect, [body('endpoint').isURL({ protocols: ['https'], require_protocol: true }).withMessage('Invalid push endpoint'), validate], notifications.pushSubscriptionStatus);
router.post('/notifications/push/subscriptions', protect, [body('endpoint').isURL({ protocols: ['https'], require_protocol: true }).withMessage('Invalid push endpoint'), body('keys').isObject(), body('keys.p256dh').isString().isLength({ min: 20, max: 256 }), body('keys.auth').isString().isLength({ min: 10, max: 256 }), body('expirationTime').optional({ nullable: true }).isNumeric(), validate], notifications.savePushSubscription);
router.delete('/notifications/push/subscriptions', protect, [body('endpoint').isURL({ protocols: ['https'], require_protocol: true }).withMessage('Invalid push endpoint'), validate], notifications.removePushSubscription);
router.post('/reviews', protect, allowRoles('CUSTOMER'), [body('request').isMongoId(), body('rating').isInt({ min: 1, max: 5 }), body('comment').optional().trim().isLength({ max: 1000 }), validate], reviews.create);
router.get('/reviews', protect, reviews.list);

router.get('/admin/overview', protect, allowRoles('ADMIN'), admin.overview);
router.get('/admin/users', protect, allowRoles('ADMIN'), admin.users);
router.patch('/admin/users/:id/active', protect, allowRoles('ADMIN'), [id, body('isActive').isBoolean(), validate], admin.setUserActive);
router.get('/admin/providers', protect, allowRoles('ADMIN'), providers.list);
router.get('/admin/requests', protect, allowRoles('ADMIN'), admin.requests);
router.get('/admin/reviews', protect, allowRoles('ADMIN'), reviews.list);
router.get('/admin/activity', protect, allowRoles('ADMIN'), admin.activity);
router.get('/admin/categories', protect, allowRoles('ADMIN'), categories.manageList);
router.post('/admin/categories', protect, allowRoles('ADMIN'), [body('name').trim().isLength({ min: 2, max: 60 }), body('slug').trim().matches(/^[a-z0-9-]+$/), validate], categories.create);
router.patch('/admin/categories/:id', protect, allowRoles('ADMIN'), [id, body('name').optional().trim().isLength({ min: 2, max: 60 }), body('slug').optional().trim().matches(/^[a-z0-9-]+$/), validate], categories.update);
router.delete('/admin/categories/:id', protect, allowRoles('ADMIN'), [id, validate], categories.remove);

router.get('/dashboard/summary', protect, asyncHandler(async (req, res) => {
  if (req.user.role === 'ADMIN') return res.status(403).json({ success: false, message: 'Use admin overview' });
  const query = req.user.role === 'CUSTOMER' ? { customer: req.user._id } : { provider: req.user._id };
  const provider = req.user.role === 'PROVIDER' ? await ProviderProfile.findOne({ user: req.user._id }).populate('categories', 'name icon').lean() : null;
  const [total, open, active, completed, unreadMessages, unreadNotifications, recent] = await Promise.all([
    ServiceRequest.countDocuments(query),
    provider ? ServiceRequest.countDocuments({ status: 'OPEN', category: { $in: provider.categories.map(category => category._id) } }) : ServiceRequest.countDocuments({ ...query, status: 'OPEN' }),
    ServiceRequest.countDocuments({ ...query, status: { $in: ['ACCEPTED', 'PROVIDER_ON_THE_WAY', 'STARTED'] } }),
    ServiceRequest.countDocuments({ ...query, status: 'COMPLETED' }),
    Message.countDocuments({ receiver: req.user._id, readAt: null }), Notification.countDocuments({ user: req.user._id, readAt: null }),
    ServiceRequest.find(query).sort({ createdAt: -1 }).limit(5).populate('category', 'name icon').populate('customer provider', 'name avatar').lean()
  ]);
  ok(res, { metrics: { total, open, active, completed, unreadMessages, unreadNotifications }, recent, provider });
}));

export default router;
