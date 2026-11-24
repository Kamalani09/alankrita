import { Schema, model } from 'mongoose';

export const adminId = 'admin';

const adminSchema = new Schema({
  _id: { type: String, enum: [adminId], required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  tokenVersion: { type: String, required: true, select: false },
});

export const Admin = model('Admin', adminSchema);
