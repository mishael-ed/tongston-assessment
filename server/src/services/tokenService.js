import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { TokenTransaction } from '../models/TokenTransaction.js';
import { ContractConversion } from '../models/ContractConversion.js';
import { AiRun } from '../models/AiRun.js';
import { AppError } from '../lib/errors.js';
import { mockTransactionHash } from '../lib/ids.js';

export const TOKEN_REWARD = 5;
export const RATES = Object.freeze({
  MOCK_USDT: 0.01,
  MOCK_ETH: 0.00005
});

function transactionsUnavailable(error) {
  return /Transaction numbers are only allowed on a replica set member or mongos/i.test(error.message);
}

async function runWithStandaloneFallback(transactionWork, fallbackWork) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await transactionWork(session);
    });
    return result;
  } catch (error) {
    if (!transactionsUnavailable(error)) throw error;
    return fallbackWork();
  } finally {
    await session.endSession();
  }
}

export async function awardAiTokens({ userId, aiRunId, amount = TOKEN_REWARD }) {
  async function award(session) {
    const options = session ? { new: true, session } : { new: true };
    let user;
    try {
      user = await User.findByIdAndUpdate(
        userId,
        { $inc: { tokenBalance: amount } },
        options
      );
      if (!user) throw new AppError(404, 'User not found');

      await AiRun.findByIdAndUpdate(aiRunId, { $set: { tokensAwarded: amount } }, session ? { session } : {});
      await TokenTransaction.create([{
        userId,
        type: 'EARN',
        source: 'AI_USAGE',
        amount,
        balanceAfter: user.tokenBalance,
        referenceId: aiRunId
      }], session ? { session } : {});
      return user.tokenBalance;
    } catch (error) {
      if (!session && user) {
        await Promise.all([
          User.findByIdAndUpdate(userId, { $inc: { tokenBalance: -amount } }),
          AiRun.findByIdAndUpdate(aiRunId, { $set: { tokensAwarded: 0 } })
        ]);
      }
      throw error;
    }
  }

  return runWithStandaloneFallback(award, () => award(null));
}

export async function convertTokens({ userId, amount, toAsset }) {
  async function convert(session) {
    const options = session ? { new: true, session } : { new: true };
    let user;
    let conversion;
    try {
      user = await User.findOneAndUpdate(
        { _id: userId, tokenBalance: { $gte: amount } },
        { $inc: { tokenBalance: -amount } },
        options
      );
      if (!user) throw new AppError(409, 'Insufficient token balance');

      const exchangeRate = RATES[toAsset];
      [conversion] = await ContractConversion.create([{
        userId,
        toAsset,
        amount,
        convertedAmount: amount * exchangeRate,
        exchangeRate,
        txHashMock: mockTransactionHash()
      }], session ? { session } : {});

      await TokenTransaction.create([{
        userId,
        type: 'CONVERT',
        source: 'SYSTEM',
        amount: -amount,
        balanceAfter: user.tokenBalance,
        referenceId: conversion._id,
        metadata: { toAsset, convertedAmount: conversion.convertedAmount }
      }], session ? { session } : {});
      return { conversion, balance: user.tokenBalance };
    } catch (error) {
      if (!session && user) {
        await User.findByIdAndUpdate(userId, { $inc: { tokenBalance: amount } });
        if (conversion) await ContractConversion.deleteOne({ _id: conversion._id });
      }
      throw error;
    }
  }

  return runWithStandaloneFallback(convert, () => convert(null));
}

export async function withdrawConversion({ userId, conversionId }) {
  async function withdraw(session) {
    let conversion;
    try {
      const txHash = mockTransactionHash('withdraw');
      conversion = await ContractConversion.findOneAndUpdate(
        { _id: conversionId, userId, status: 'AVAILABLE' },
        { $set: { status: 'WITHDRAWN', withdrawalTxHashMock: txHash, withdrawnAt: new Date() } },
        session ? { new: true, session } : { new: true }
      );
      if (!conversion) throw new AppError(404, 'Available conversion not found');

      const query = User.findById(userId);
      if (session) query.session(session);
      const user = await query;
      await TokenTransaction.create([{
        userId,
        type: 'WITHDRAW',
        source: 'SYSTEM',
        amount: 0,
        balanceAfter: user.tokenBalance,
        referenceId: conversion._id,
        metadata: { asset: conversion.toAsset, assetAmount: conversion.convertedAmount, txHash }
      }], session ? { session } : {});
      return conversion;
    } catch (error) {
      if (!session && conversion) {
        await ContractConversion.findByIdAndUpdate(conversion._id, {
          $set: { status: 'AVAILABLE' },
          $unset: { withdrawalTxHashMock: 1, withdrawnAt: 1 }
        });
      }
      throw error;
    }
  }

  return runWithStandaloneFallback(withdraw, () => withdraw(null));
}
