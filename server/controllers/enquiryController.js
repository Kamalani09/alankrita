import { Enquiry } from '../models/Enquiry.js';
import { Product } from '../models/Product.js';
import { ApiError, sendSuccess } from '../utils/http.js';

export async function recordEnquiry(request, response) {
  const { product } = request.input;
  const published = await Product.exists({ _id: product, published: true });
  if (!published) throw new ApiError(404, 'Product not found.');
  await Enquiry.create({ product });
  return sendSuccess(response, null, 'Enquiry recorded.', 201);
}

export async function listEnquiries(request, response) {
  const { page = 1 } = request.input;
  const limit = 20;
  const [items, total] = await Promise.all([
    Enquiry.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('product', 'name productCode').lean(),
    Enquiry.countDocuments(),
  ]);
  return sendSuccess(response, { items, page, total, totalPages: Math.ceil(total / limit) });
}

export function getTopEnquiredProducts() {
  return Enquiry.aggregate([
    { $group: { _id: '$product', clicks: { $sum: 1 } } },
    { $sort: { clicks: -1, _id: 1 } },
    { $lookup: { from: Product.collection.name, localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $limit: 5 },
    { $project: { clicks: 1, name: '$product.name', productCode: '$product.productCode' } },
  ]);
}
