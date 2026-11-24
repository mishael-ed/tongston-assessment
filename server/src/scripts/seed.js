import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../db.js';
import { User } from '../models/User.js';
import { ContentItem } from '../models/ContentItem.js';

async function seed() {
  await connectDatabase();
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@tworld.local' },
    { $set: { passwordHash, role: 'admin' }, $setOnInsert: { tokenBalance: 0 } },
    { upsert: true, new: true }
  );
  await User.findOneAndUpdate(
    { email: 'user@tworld.local' },
    { $set: { passwordHash, role: 'user' }, $setOnInsert: { tokenBalance: 0 } },
    { upsert: true }
  );
  if (await ContentItem.countDocuments() === 0) {
    await ContentItem.create({
      title: 'Building useful communities',
      body: 'Strong communities grow when people can share practical knowledge and receive fair recognition for their contribution. T-World connects useful content with simple AI tools. Members can summarize long material, earn platform tokens for productive activity, and exchange those tokens through a transparent ledger. The first release keeps the mechanics understandable while leaving clear seams for real providers later.',
      tags: ['community', 'ai', 'rewards'],
      createdBy: admin.id
    });
  }
  console.log('Seed complete. Login: admin@tworld.local / Password123!');
}

seed().then(disconnectDatabase).catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});
