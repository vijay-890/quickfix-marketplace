import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';

export function notFound(req, _res, next) { next(new AppError(`Route ${req.method} ${req.originalUrl} was not found`, 404)); }

export function errorHandler(error, _req, res, _next) {
  let status = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  if (error instanceof mongoose.Error.ValidationError) { status = 400; message = Object.values(error.errors).map(e => e.message).join(', '); }
  if (error instanceof mongoose.Error.CastError) { status = 400; message = 'Invalid identifier'; }
  if (error.code === 11000) { status = 409; message = `${Object.keys(error.keyValue || {})[0] || 'Value'} is already in use`; }
  if (error.name === 'MongoServerError' && error.code === 121) { status = 400; message = 'Submitted data did not pass database validation'; }
  if (process.env.NODE_ENV !== 'production' && !error.isOperational) console.error(error);
  res.status(status).json({ success: false, message: process.env.NODE_ENV === 'production' && status >= 500 ? 'Something went wrong on our end' : message });
}
