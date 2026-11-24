import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  tokenBalance: { type: Number, min: 0, default: 0 }
}, { timestamps: true, versionKey: false });

export const User = mongoose.model('User', userSchema);
