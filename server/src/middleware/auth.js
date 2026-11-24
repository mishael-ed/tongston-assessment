import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';
import { User } from '../models/User.js';

export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new AppError(401, 'Authentication required');

    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) throw new AppError(401, 'Account no longer exists');

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(401, 'Invalid or expired token'));
  }
}

export const allowRoles = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'You do not have permission to do that'));
  next();
};
