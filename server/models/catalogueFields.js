import { Schema } from 'mongoose';

export const occasions = ['daily', 'party', 'bridal', 'festive'];
export const stockStatuses = ['in_stock', 'low_stock', 'sold_out'];

export const imageSchema = new Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true, trim: true },
}, { _id: false });
