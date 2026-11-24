import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { storageService } from '../services/storageService.js';
import { AppError } from '../lib/errors.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, done) => {
    const allowed = /^(image|video|audio)\//.test(file.mimetype) || file.mimetype === 'application/pdf';
    done(allowed ? null : new AppError(415, 'Unsupported file type'), allowed);
  }
});

router.use(authenticate);

router.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) return next(new AppError(422, 'A file is required'));
  const stored = await storageService.upload(req.file);
  const asset = await MediaAsset.create({
    ownerId: req.user.id,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    provider: 'CLOUDINARY',
    ...stored
  });
  res.status(201).json({ asset });
});

router.post('/:id/promote', allowRoles('admin'), validate(z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') })
})), async (req, res, next) => {
  const asset = await MediaAsset.findOne({ _id: req.validated.params.id, provider: 'CLOUDINARY' });
  if (!asset) return next(new AppError(404, 'Cloudinary asset not found'));

  const promoted = await storageService.promote(asset);
  asset.provider = 'S3';
  asset.providerKey = promoted.providerKey;
  asset.url = promoted.url;
  asset.promotedAt = new Date();
  await asset.save();
  res.json({ asset });
});

export default router;
