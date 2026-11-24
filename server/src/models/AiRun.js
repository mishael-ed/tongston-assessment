import mongoose from 'mongoose';

const aiRunSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContentItem', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  promptVersion: { type: String, required: true },
  status: { type: String, enum: ['RUNNING', 'SUCCESS', 'FALLBACK', 'FAILED'], required: true },
  output: { type: String, default: '' },
  error: { type: String, default: '' },
  latencyMs: { type: Number, min: 0, default: 0 },
  tokensAwarded: { type: Number, min: 0, default: 0 },
  request: {
    tone: { type: String },
    length: { type: String }
  }
}, { timestamps: true, versionKey: false });

aiRunSchema.index({ createdAt: -1 });

export const AiRun = mongoose.model('AiRun', aiRunSchema);
