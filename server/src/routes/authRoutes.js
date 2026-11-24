import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../lib/errors.js';

const router = Router();
const credentials = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(8).max(72) }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough()
});

function presentUser(user) {
  return { id: user.id, email: user.email, role: user.role, tokenBalance: user.tokenBalance };
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '12h' });
}

router.post('/register', validate(credentials), async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: issueToken(user), user: presentUser(user) });
});

router.post('/login', validate(credentials), async (req, res, next) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return next(new AppError(401, 'Email or password is incorrect'));
  }
  res.json({ token: issueToken(user), user: presentUser(user) });
});

router.get('/me', authenticate, (req, res) => res.json({ user: presentUser(req.user) }));

export default router;
