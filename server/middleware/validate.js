import { validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';
export default (req, _res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) return next(new AppError(result.array().map(e => e.msg).join(', '), 400));
  next();
};
