import { Schema, model } from 'mongoose';
import { siteDefaults } from '../config/siteDefaults.js';
import { imageSchema } from './catalogueFields.js';

export const settingsId = 'site';

const faqSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const settingsSchema = new Schema({
  _id: { type: String, enum: [settingsId], required: true },
  announcementText: { type: String, default: siteDefaults.announcementText },
  announcementEnabled: { type: Boolean, default: siteDefaults.announcementEnabled },
  heroHeading: { type: String, default: siteDefaults.heroHeading },
  heroSubtext: { type: String, default: siteDefaults.heroSubtext },
  heroImage: { type: imageSchema, default: null },
  whatsappNumber: { type: String, default: siteDefaults.whatsappNumber },
  instagramHandle: { type: String, default: siteDefaults.instagramHandle },
  email: { type: String, default: siteDefaults.email },
  address: { type: String, default: siteDefaults.address },
  workingHours: { type: String, default: siteDefaults.workingHours },
  aboutText: { type: String, default: siteDefaults.aboutText },
  faqItems: { type: [faqSchema], default: () => [] },
  trustStripItems: { type: [String], default: () => [] },
});

export const SiteSettings = model('SiteSettings', settingsSchema);
