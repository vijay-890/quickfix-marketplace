import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const safeUser = user => ({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar });
const signToken = user => jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'CUSTOMER' } = req.body;
  const safeRole = ['CUSTOMER', 'PROVIDER'].includes(String(role).toUpperCase()) ? String(role).toUpperCase() : null;
  if (!safeRole) throw new AppError('Choose a customer or provider account', 400);
  const user = await User.create({ name, email, password, role: safeRole });
  if (safeRole === 'PROVIDER') await ProviderProfile.create({ user: user._id });
  ok(res, { user: safeUser(user), token: signToken(user) }, 'Your QuickFix account is ready', 201);
});
export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.verifyPassword(req.body.password))) throw new AppError('Email or password is incorrect', 401);
  if (!user.isActive) throw new AppError('This account has been disabled. Contact support for help.', 403);
  ok(res, { user: safeUser(user), token: signToken(user) }, 'Welcome back');
});
export const me = asyncHandler(async (req, res) => {
  const profile = req.user.role === 'PROVIDER' ? await ProviderProfile.findOne({ user: req.user._id }).populate('categories', 'name icon slug') : null;
  ok(res, { user: safeUser(req.user), profile });
});
export const updateMe = asyncHandler(async (req, res) => {
  const fields = {};
  for (const key of ['name', 'phone']) if (req.body[key] !== undefined) fields[key] = req.body[key];
  const user = await User.findByIdAndUpdate(req.user._id, { $set: fields }, { new: true, runValidators: true });
  let profile = null;
  if (req.user.role === 'PROVIDER') {
    const permitted = ['bio', 'skills', 'categories', 'experienceYears', 'hourlyRate', 'serviceArea'];
    const update = Object.fromEntries(permitted.filter(k => req.body[k] !== undefined).map(k => [k, req.body[k]]));
    if (update.categories) {
      if (!Array.isArray(update.categories) || update.categories.length > 12) throw new AppError('Choose up to 12 service categories', 400);
      const valid = await ServiceCategory.countDocuments({ _id: { $in: update.categories }, isActive: true });
      if (valid !== new Set(update.categories.map(String)).size) throw new AppError('One or more selected service categories are unavailable', 400);
    }
    if (update.skills && (!Array.isArray(update.skills) || update.skills.length > 20)) throw new AppError('Choose up to 20 skills', 400);
    profile = await ProviderProfile.findOneAndUpdate({ user: user._id }, { $set: update }, { new: true, runValidators: true }).populate('categories', 'name icon slug');
  }
  ok(res, { user: safeUser(user), profile }, 'Profile saved');
});
