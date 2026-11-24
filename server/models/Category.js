import { Schema, model } from 'mongoose';
import { imageSchema } from './catalogueFields.js';

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  image: { type: imageSchema },
  description: { type: String, trim: true, default: '' },
  order: { type: Number, min: 0, default: 0 },
});

export const Category = model('Category', categorySchema);
