import mongoose from 'mongoose';

const tokenTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['EARN', 'CONVERT', 'WITHDRAW'], required: true },
  source: { type: String, enum: ['AI_USAGE', 'MANUAL', 'SYSTEM'], required: true },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true, min: 0 },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, versionKey: false });

tokenTransactionSchema.index({ userId: 1, createdAt: -1 });
for (const operation of ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete']) {
  tokenTransactionSchema.pre(operation, function rejectLedgerMutation() {
    throw new Error('Token ledger entries are immutable');
  });
}

export const TokenTransaction = mongoose.model('TokenTransaction', tokenTransactionSchema);
