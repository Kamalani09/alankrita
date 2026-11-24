import { body } from 'express-validator';
import { occasions, stockStatuses } from '../models/catalogueFields.js';
import { amount, boolean, isImage, objectWithKeys, queryValue, slugPattern, strings, text, validate } from '../middleware/validate.js';

export const loginInput = validate([
  body('email').isString().bail().trim().isEmail().bail().customSanitizer((email) => email.toLowerCase()),
  body('password').isString().bail().custom((password) => password.length > 0 && Buffer.byteLength(password) <= 72),
]);

export function productInput(create = false) {
  const category = body('category');
  const occasion = body('occasion');
  if (!create) {
    category.optional();
    occasion.optional();
  }

  return validate([
    text('name', { required: create }),
    text('slug').matches(slugPattern),
    text('productCode', { max: 40 }).matches(/^[a-z0-9][a-z0-9_-]*$/i).toUpperCase(),
    category.isString().bail().isMongoId(),
    occasion.isString().bail().isIn(occasions),
    amount('price', { required: create }),
    amount('originalPrice', { nullable: true }),
    text('description', { min: 0, max: 5000 }),
    strings('details', 30, 250),
    strings('colors', 30, 60),
    body('images').optional().custom((images) => Array.isArray(images) && images.length <= 6 && images.every(isImage)),
    body('stockStatus').optional().isString().bail().isIn(stockStatuses),
    boolean('featured'), boolean('newArrival'), boolean('combo'), boolean('published'),
  ]);
}

export function productQuery(admin = false) {
  return validate([
    queryValue('category').isLength({ min: 1, max: 120 }).matches(slugPattern),
    queryValue('occasion').isIn(occasions),
    queryValue('minPrice').matches(/^\d{1,8}(?:\.\d{1,2})?$/).bail().toFloat(),
    queryValue('maxPrice').matches(/^\d{1,8}(?:\.\d{1,2})?$/).bail().toFloat(),
    queryValue('color').trim().isLength({ min: 1, max: 60 }),
    queryValue('stock').isIn(stockStatuses),
    queryValue('combo').isIn(['true', 'false']).bail().toBoolean(true),
    queryValue('featured').isIn(['true', 'false']).bail().toBoolean(true),
    queryValue('search').trim().isLength({ min: 1, max: 100 }),
    queryValue('sort').isIn(['newest', 'price_asc', 'price_desc']),
    queryValue('page').isInt({ min: 1, max: 1000 }).bail().toInt(),
    queryValue('limit').isInt({ min: 1, max: 50 }).bail().toInt(),
    ...(admin ? [queryValue('published').isIn(['true', 'false']).bail().toBoolean(true)] : []),
  ], 'query');
}

export function categoryInput(create = false) {
  return validate([
    text('name', { required: create }),
    text('slug').matches(slugPattern),
    text('description', { min: 0, max: 2000 }),
    body('order').optional().custom((value) => Number.isInteger(value) && value >= 0 && value <= 1000000),
    body('image').optional().custom((value) => value === null || isImage(value)),
  ]);
}

export const settingsInput = validate([
  text('announcementText', { min: 0, max: 250 }),
  boolean('announcementEnabled'),
  text('heroHeading', { max: 160 }),
  text('heroSubtext', { max: 300 }),
  body('heroImage').optional().custom((value) => value === null || isImage(value)),
  text('whatsappNumber', { max: 15 }).matches(/^[1-9]\d{7,14}$/),
  text('instagramHandle', { max: 31 }).matches(/^@[a-z0-9_.]{1,30}$/i),
  text('email', { max: 254 }).isEmail(),
  text('address', { max: 350 }),
  text('workingHours', { max: 120 }),
  text('aboutText', { min: 0, max: 5000 }),
  strings('trustStripItems', 12, 120),
  body('faqItems').optional().custom((items) => Array.isArray(items) && items.length <= 30 &&
    items.every((item) => objectWithKeys(item, ['question', 'answer']) &&
      typeof item.question === 'string' && item.question.trim().length > 0 && item.question.length <= 200 &&
      typeof item.answer === 'string' && item.answer.trim().length > 0 && item.answer.length <= 2000))
    .bail().customSanitizer((items) => items.map(({ question, answer }) => ({
      question: question.trim(), answer: answer.trim(),
    }))),
]);
