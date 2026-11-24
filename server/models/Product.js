import { Schema, model } from 'mongoose';
import { imageSchema, occasions, stockStatuses } from './catalogueFields.js';

const productSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  productCode: { type: String, required: true, unique: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  occasion: { type: String, enum: occasions, required: true },
  price: { type: Number, min: 0, required: true },
  originalPrice: { type: Number, min: 0 },
  description: { type: String, trim: true, default: '' },
  details: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  images: {
    type: [imageSchema],
    validate: [(images) => images.length <= 6, 'A product can have at most six images.'],
  },
  stockStatus: { type: String, enum: stockStatuses, default: 'in_stock' },
  featured: { type: Boolean, default: false },
  newArrival: { type: Boolean, default: false },
  combo: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
}, { timestamps: true, optimisticConcurrency: true });

productSchema.index({ name: 'text', productCode: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ published: 1, createdAt: -1, _id: -1 });
productSchema.index({ published: 1, category: 1, price: 1, _id: 1 });

export const Product = model('Product', productSchema);
