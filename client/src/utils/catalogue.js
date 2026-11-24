export const stockLabels = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  sold_out: 'Sold out',
};

export const occasions = [
  ['Daily wear', 'daily'],
  ['Party wear', 'party'],
  ['Bridal / wedding', 'bridal'],
  ['Festive', 'festive'],
];

export const budgets = [
  ['Under ₹299', { maxPrice: '299' }],
  ['₹300–₹599', { minPrice: '300', maxPrice: '599.99' }],
  ['₹600 and above', { minPrice: '600' }],
];

export function productPath(slug) {
  return '/product/' + encodeURIComponent(slug);
}

export function shopPath(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  return query ? '/shop?' + query : '/shop';
}

export function catalogueParams(source) {
  const filters = new URLSearchParams();
  for (const key of ['search', 'category', 'occasion', 'color', 'stock', 'combo', 'featured', 'minPrice', 'maxPrice', 'sort', 'page']) {
    const value = source.get(key)?.trim();
    if (value) filters.set(key, value);
  }
  return filters;
}
