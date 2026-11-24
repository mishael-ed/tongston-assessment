import mongoose from 'mongoose';

const contractConversionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fromToken: { type: String, enum: ['TWT'], default: 'TWT' },
  toAsset: { type: String, enum: ['MOCK_USDT', 'MOCK_ETH'], required: true },
  amount: { type: Number, required: true, min: 1 },
  convertedAmount: { type: Number, required: true, min: 0 },
  exchangeRate: { type: Number, required: true, min: 0 },
  txHashMock: { type: String, required: true, unique: true },
  status: { type: String, enum: ['AVAILABLE', 'WITHDRAWN'], default: 'AVAILABLE' },
  withdrawalTxHashMock: { type: String },
  withdrawnAt: { type: Date }
}, { timestamps: true, versionKey: false });

contractConversionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const ContractConversion = mongoose.model('ContractConversion', contractConversionSchema);
