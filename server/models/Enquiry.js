import { Schema, model } from 'mongoose';

const enquirySchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  createdAt: { type: Date, default: Date.now, required: true },
}, { versionKey: false });

enquirySchema.index({ createdAt: -1, _id: -1 });
enquirySchema.index({ product: 1 });

export const Enquiry = model('Enquiry', enquirySchema);
