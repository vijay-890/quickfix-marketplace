import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { fileTypeFromFile } from 'file-type';
import multer from 'multer';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { ok } from '../utils/response.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pushRequest } from '../services/requestWorkflow.js';

const uploadDir = path.resolve(process.env.UPLOAD_DIR || fileURLToPath(new URL('../uploads/', import.meta.url)));
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}.${({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' })[file.mimetype] || 'img'}`)
});
export const imageUpload = multer({ storage, limits: { fileSize: Math.min(10, Number(process.env.MAX_UPLOAD_MB) || 5) * 1024 * 1024, files: 4 }, fileFilter: (_req, file, cb) => {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.mimetype)) return cb(new AppError('Upload a JPG, PNG, WEBP, or AVIF image', 400));
  cb(null, true);
} });

export async function verifyImageContent(req, _res, next) {
  const files = [req.file, ...(req.files || [])].filter(Boolean);
  try {
    for (const file of files) {
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(detected.mime)) {
        await fs.promises.unlink(file.path).catch(() => {});
        throw new AppError('The uploaded file is not a supported image', 400);
      }
      const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' })[detected.mime];
      const safePath = `${file.path.slice(0, file.path.lastIndexOf('.'))}.${extension}`;
      if (safePath !== file.path) { await fs.promises.rename(file.path, safePath); file.path = safePath; file.filename = safePath.split(/[\\/]/).at(-1); }
    }
    next();
  } catch (error) { next(error); }
}

export const avatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload', 400);
  const image = `/uploads/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user._id, { $set: { avatar: image } });
  if (req.user.role === 'PROVIDER') await ProviderProfile.updateOne({ user: req.user._id }, { $set: { photo: image } });
  ok(res, { url: image }, 'Profile photo updated');
});

export const requestImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new AppError('Choose at least one image to upload', 400);
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new AppError('Service request not found', 404);
  if (String(request.customer) !== String(req.user._id) && req.user.role !== 'ADMIN') throw new AppError('Only the customer can add request photos', 403);
  request.images.push(...req.files.map(file => `/uploads/${file.filename}`));
  await request.save();
  ok(res, await pushRequest(request), 'Request photos added');
});
