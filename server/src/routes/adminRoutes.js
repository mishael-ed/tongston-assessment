import { Router } from 'express';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { AiRun } from '../models/AiRun.js';
import { ContractConversion } from '../models/ContractConversion.js';

const router = Router();
router.use(authenticate, allowRoles('admin'));

router.get('/users', async (_req, res) => {
  const users = await User.find().select('email role tokenBalance createdAt').sort({ createdAt: -1 });
  res.json({ users });
});

router.get('/ai-runs', async (_req, res) => {
  const runs = await AiRun.find()
    .populate('contentId', 'title')
    .populate('userId', 'email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ runs });
});

router.get('/conversions', async (_req, res) => {
  const conversions = await ContractConversion.find().populate('userId', 'email').sort({ createdAt: -1 }).limit(100);
  res.json({ conversions });
});

export default router;
