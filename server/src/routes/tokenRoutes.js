import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { TokenTransaction } from '../models/TokenTransaction.js';
import { ContractConversion } from '../models/ContractConversion.js';
import { convertTokens, withdrawConversion } from '../services/tokenService.js';

const router = Router();
router.use(authenticate);
const empty = z.object({}).passthrough();

router.get('/balance', async (req, res) => {
  const conversions = await ContractConversion.find({ userId: req.user.id, status: 'AVAILABLE' }).sort({ createdAt: -1 });
  res.json({ tokenBalance: req.user.tokenBalance, conversions });
});

router.get('/history', validate(z.object({
  body: empty,
  params: empty,
  query: z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) })
})), async (req, res) => {
  const { page, limit } = req.validated.query;
  const filter = { userId: req.user.id };
  const [transactions, total] = await Promise.all([
    TokenTransaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    TokenTransaction.countDocuments(filter)
  ]);
  res.json({ transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.post('/convert', validate(z.object({
  body: z.object({ toAsset: z.enum(['MOCK_USDT', 'MOCK_ETH']), amount: z.number().int().positive() }),
  params: empty,
  query: empty
})), async (req, res) => {
  const { conversion, balance } = await convertTokens({ userId: req.user.id, ...req.validated.body });
  res.status(201).json({
    conversionId: conversion.id,
    txHashMock: conversion.txHashMock,
    convertedAmount: `${conversion.convertedAmount} ${conversion.toAsset}`,
    totalTokenBalance: balance
  });
});

router.post('/withdraw', validate(z.object({
  body: z.object({ conversionId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid conversion id') }),
  params: empty,
  query: empty
})), async (req, res) => {
  const conversion = await withdrawConversion({ userId: req.user.id, conversionId: req.validated.body.conversionId });
  res.json({ status: 'SUCCESS', network: 'Ethereum', txHashMock: conversion.withdrawalTxHashMock });
});

export default router;
