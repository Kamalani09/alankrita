import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError, sendSuccess } from '../utils/http.js';
import { createSlug } from '../utils/slug.js';

const sorts = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
};

const publicFields = '-__v -images.publicId';
const categoryFields = 'name slug';

function literalPattern(value, exact = false) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(exact ? `^${escaped}$` : escaped, 'i');
}

export function listProducts(admin = false) {
  return async (request, response) => {
    const {
      category, occasion, minPrice, maxPrice, color, stock, combo, featured, published,
      search, sort = 'newest', page = 1, limit = 12,
    } = request.input;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw new ApiError(400, 'minPrice must be less than or equal to maxPrice.');
    }

    const filter = admin ? {} : { published: true };
    if (admin && published !== undefined) filter.published = published;
    if (category) {
      const entry = await Category.findOne({
        $or: [{ slug: category }, ...(mongoose.isObjectIdOrHexString(category) ? [{ _id: category }] : [])],
      }).select('_id').lean();
      filter.category = entry?._id ?? null;
    }
    if (occasion) filter.occasion = occasion;
    if (stock) filter.stockStatus = stock;
    if (color) filter.colors = literalPattern(color, true);
    if (combo !== undefined) filter.combo = combo;
    if (featured !== undefined) filter.featured = featured;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (search) {
      const expression = literalPattern(search);
      const categories = await Category.find({ $or: [{ name: expression }, { slug: expression }] }).distinct('_id');
      filter.$or = [
        { name: expression }, { productCode: expression }, { description: expression },
        { category: { $in: categories } },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter).select(admin ? '-__v' : publicFields)
        .populate('category', categoryFields).sort(sorts[sort]).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return sendSuccess(response, { items, page, limit, total, totalPages: Math.ceil(total / limit) });
  };
}

export async function getPublicProduct(request, response) {
  const product = await Product.findOne({ slug: request.input.slug, published: true })
    .select(publicFields).populate('category', categoryFields).lean();
  if (!product) throw new ApiError(404, 'Product not found.');
  return sendSuccess(response, product);
}

export async function getAdminProduct(request, response) {
  const product = await Product.findById(request.input.id).select('-__v').populate('category', categoryFields).lean();
  if (!product) throw new ApiError(404, 'Product not found.');
  return sendSuccess(response, product);
}

async function lockCategory(id, session) {
  // Write to the same category document that deletion touches, serializing the two operations.
  const result = await Category.updateOne({ _id: id }, { $inc: { __v: 1 } }, { session });
  if (!result.matchedCount) throw new ApiError(400, 'Category does not exist.');
}

function checkOriginalPrice(product) {
  if (product.originalPrice != null && product.originalPrice <= product.price) {
    throw new ApiError(400, 'originalPrice must be greater than price, or null to remove it.');
  }
}

export async function createProduct(request, response) {
  const { name, slug, productCode, ...fields } = request.input;
  const product = await mongoose.connection.transaction(async (session) => {
    await lockCategory(fields.category, session);
    const entry = new Product({
      ...fields,
      name,
      slug: slug ?? createSlug(name),
      productCode: productCode ?? `ALK-${randomBytes(5).toString('hex').toUpperCase()}`,
    });
    checkOriginalPrice(entry);
    return entry.save({ session });
  });
  return sendSuccess(response, product.toObject({ versionKey: false }), 'Product created.', 201);
}

export async function updateProduct(request, response) {
  const { id, ...fields } = request.input;
  if (!Object.keys(fields).length) throw new ApiError(400, 'Provide at least one product field.');

  const product = await mongoose.connection.transaction(async (session) => {
    const entry = await Product.findById(id).session(session);
    if (!entry) throw new ApiError(404, 'Product not found.');
    if (fields.category && !entry.category.equals(fields.category)) {
      await lockCategory(fields.category, session);
    }
    entry.set(fields);
    checkOriginalPrice(entry);
    return entry.save({ session });
  });
  return sendSuccess(response, product.toObject({ versionKey: false }), 'Product updated.');
}

export async function deleteProduct(request, response) {
  const product = await Product.findByIdAndDelete(request.input.id);
  if (!product) throw new ApiError(404, 'Product not found.');
  return sendSuccess(response, null, 'Product deleted.');
}
