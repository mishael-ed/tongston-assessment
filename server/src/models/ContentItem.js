import mongoose from 'mongoose';

const contentItemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 180 },
  body: { type: String, required: true, maxlength: 50000 },
  tags: [{ type: String, trim: true, lowercase: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true, versionKey: false });

contentItemSchema.index({ title: 'text', body: 'text', tags: 'text' });
contentItemSchema.index({ tags: 1, createdAt: -1 });

export const ContentItem = mongoose.model('ContentItem', contentItemSchema);
