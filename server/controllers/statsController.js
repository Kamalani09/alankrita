import { Product } from '../models/Product.js';
import { sendSuccess } from '../utils/http.js';
import { getTopEnquiredProducts } from './enquiryController.js';

export function getStats(trackEnquiries) {
  return async (_request, response) => {
    const [counts] = await Product.aggregate([{
      $group: {
        _id: null,
        total: { $sum: 1 },
        inStock: { $sum: { $cond: [{ $eq: ['$stockStatus', 'in_stock'] }, 1, 0] } },
        lowStock: { $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] } },
        soldOut: { $sum: { $cond: [{ $eq: ['$stockStatus', 'sold_out'] }, 1, 0] } },
        featured: { $sum: { $cond: ['$featured', 1, 0] } },
      },
    }, { $project: { _id: 0 } }]);
    const stats = counts ?? { total: 0, inStock: 0, lowStock: 0, soldOut: 0, featured: 0 };
    if (trackEnquiries) stats.topEnquiredProducts = await getTopEnquiredProducts();
    return sendSuccess(response, stats);
  };
}
