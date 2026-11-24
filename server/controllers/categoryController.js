import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError, sendSuccess } from '../utils/http.js';
import { createSlug } from '../utils/slug.js';

export function listCategories(admin = false) {
  return async (_request, response) => {
    const categories = await Category.find().select(admin ? '-__v' : '-__v -image.publicId')
      .sort({ order: 1, name: 1, _id: 1 }).lean();
    return sendSuccess(response, categories);
  };
}

export async function createCategory(request, response) {
  const { name, slug, ...fields } = request.input;
  const category = await Category.create({ ...fields, name, slug: slug ?? createSlug(name) });
  return sendSuccess(response, category.toObject({ versionKey: false }), 'Category created.', 201);
}

export async function updateCategory(request, response) {
  const { id, ...fields } = request.input;
  if (!Object.keys(fields).length) throw new ApiError(400, 'Provide at least one category field.');
  const category = await Category.findByIdAndUpdate(id, { $set: fields }, {
    returnDocument: 'after', runValidators: true,
  }).select('-__v').lean();
  if (!category) throw new ApiError(404, 'Category not found.');
  return sendSuccess(response, category, 'Category updated.');
}

export async function deleteCategory(request, response) {
  const { id } = request.input;
  await mongoose.connection.transaction(async (session) => {
    const category = await Category.findByIdAndDelete(id, { session });
    if (!category) throw new ApiError(404, 'Category not found.');
    if (await Product.exists({ category: id }).session(session)) {
      throw new ApiError(409, 'Move or delete products in this category first.');
    }
  });
  return sendSuccess(response, null, 'Category deleted.');
}
