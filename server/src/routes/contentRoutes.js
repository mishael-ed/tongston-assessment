import { Router } from 'express';
import { z } from 'zod';
import { ContentItem } from '../models/ContentItem.js';
import { AiRun } from '../models/AiRun.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../lib/errors.js';
import { summarize, fallbackSummary, PROMPT_VERSION } from '../services/aiService.js';
import { awardAiTokens, TOKEN_REWARD } from '../services/tokenService.js';

const router = Router();
router.use(authenticate);

const contentBody = z.object({
  title: z.string().trim().min(3).max(180),
  body: z.string().trim().min(20).max(50000),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([])
});
const empty = z.object({}).passthrough();
const idParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });

router.post('/', allowRoles('admin'), validate(z.object({ body: contentBody, query: empty, params: empty })), async (req, res) => {
  const item = await ContentItem.create({ ...req.validated.body, createdBy: req.user.id });
  res.status(201).json({ item });
});

router.get('/', validate(z.object({
  body: empty,
  query: z.object({
    tag: z.string().trim().optional(),
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
  }),
  params: empty
})), async (req, res) => {
  const { tag, q, page, limit } = req.validated.query;
  const filter = { ...(tag ? { tags: tag.toLowerCase() } : {}), ...(q ? { $text: { $search: q } } : {}) };
  const [items, total] = await Promise.all([
    ContentItem.find(filter).populate('createdBy', 'email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    ContentItem.countDocuments(filter)
  ]);
  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.get('/:id', validate(z.object({ body: empty, query: empty, params: idParams })), async (req, res, next) => {
  const item = await ContentItem.findById(req.validated.params.id).populate('createdBy', 'email');
  if (!item) return next(new AppError(404, 'Content item not found'));
  res.json({ item });
});

router.patch('/:id', allowRoles('admin'), validate(z.object({
  body: contentBody.partial().refine((value) => Object.keys(value).length > 0, 'At least one field is required'),
  query: empty,
  params: idParams
})), async (req, res, next) => {
  const item = await ContentItem.findByIdAndUpdate(req.validated.params.id, req.validated.body, { new: true, runValidators: true });
  if (!item) return next(new AppError(404, 'Content item not found'));
  res.json({ item });
});

router.delete('/:id', allowRoles('admin'), validate(z.object({ body: empty, query: empty, params: idParams })), async (req, res, next) => {
  const item = await ContentItem.findByIdAndDelete(req.validated.params.id);
  if (!item) return next(new AppError(404, 'Content item not found'));
  res.status(204).end();
});

router.post('/:id/ai/summarize', validate(z.object({
  body: z.object({
    tone: z.enum(['neutral', 'professional', 'friendly']).default('neutral'),
    length: z.enum(['short', 'medium', 'long']).default('medium')
  }),
  query: empty,
  params: idParams
})), async (req, res, next) => {
  const content = await ContentItem.findById(req.validated.params.id);
  if (!content) return next(new AppError(404, 'Content item not found'));

  const run = await AiRun.create({
    contentId: content.id,
    userId: req.user.id,
    promptVersion: PROMPT_VERSION,
    status: 'RUNNING',
    request: req.validated.body
  });
  const startedAt = performance.now();

  try {
    const output = await summarize(content, req.validated.body);
    const latencyMs = Math.round(performance.now() - startedAt);
    await AiRun.findByIdAndUpdate(run.id, { status: 'SUCCESS', output, latencyMs });
    const totalTokenBalance = await awardAiTokens({ userId: req.user.id, aiRunId: run.id, amount: TOKEN_REWARD });
    res.json({ runId: run.id, output, latencyMs, tokensAwarded: TOKEN_REWARD, totalTokenBalance, usedFallback: false });
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startedAt);
    const output = fallbackSummary(content);
    await AiRun.findByIdAndUpdate(run.id, { status: 'FALLBACK', output, latencyMs, error: error.message });
    res.status(200).json({ runId: run.id, output, latencyMs, tokensAwarded: 0, totalTokenBalance: req.user.tokenBalance, usedFallback: true });
  }
});

export default router;
