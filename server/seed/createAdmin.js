import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { Admin, adminId } from '../models/Admin.js';

async function seed() {
  const uri = process.env.MONGODB_URI?.trim();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  const emailValidation = await body('email').isEmail().run({ body: { email } });
  if (!uri || !emailValidation.isEmpty() || !password ||
      password.length < 12 || Buffer.byteLength(password) > 72) {
    console.error('Set MONGODB_URI, a valid ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters and at most 72 UTF-8 bytes.');
    process.exitCode = 1;
    return;
  }

  await connectDatabase(uri);
  await Admin.init();
  const passwordHash = await bcrypt.hash(password, 12);
  // A rerun rotates the credentials and invalidates every previously issued token.
  await Admin.updateOne({ _id: adminId }, {
    $set: { email, passwordHash, tokenVersion: randomUUID() },
  }, { upsert: true, runValidators: true });
  console.info('Admin credentials saved.');
}

try {
  await seed();
} catch (error) {
  console.error(`Admin seed failed (${error.code ?? error.name}). Check the database configuration.`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
