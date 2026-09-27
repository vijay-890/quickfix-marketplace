import ServiceCategory from '../models/ServiceCategory.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
export const list = asyncHandler(async (_req, res) => ok(res, await ServiceCategory.find({ isActive: true }).sort('name').lean()));
export const manageList = asyncHandler(async (_req, res) => ok(res, await ServiceCategory.find().sort('name').lean()));
export const create = asyncHandler(async (req, res) => ok(res, await ServiceCategory.create(req.body), 'Category created', 201));
export const update = asyncHandler(async (req, res) => {
  const row = await ServiceCategory.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!row) throw new AppError('Category not found', 404);
  ok(res, row, 'Category updated');
});
export const remove = asyncHandler(async (req, res) => {
  const row = await ServiceCategory.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!row) throw new AppError('Category not found', 404);
  ok(res, row, 'Category archived');
});
