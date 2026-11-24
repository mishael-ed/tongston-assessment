import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './lib/errors.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.CLIENT_ORIGIN.split(',').map((origin) => origin.trim()) }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.get('/', (_req, res) => res.redirect(config.CLIENT_ORIGIN.split(',')[0].trim()));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-8' }), authRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/tokens', tokenRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
