import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  provider: { type: String, enum: ['CLOUDINARY', 'S3'], required: true },
  providerKey: { type: String, required: true },
  url: { type: String, required: true },
  promotedAt: { type: Date }
}, { timestamps: true, versionKey: false });

export const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);
