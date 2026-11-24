const pages = {
  '/': ['Alankrita | Imitation Jewellery Online | Order on WhatsApp', 'Trendy imitation jewellery for every occasion. Browse Alankrita’s collection and order on WhatsApp.'],
  '/shop': ['Shop Imitation Jewellery | Alankrita', 'Browse Alankrita’s imitation jewellery by category, budget, colour and occasion. Order on WhatsApp.'],
  '/about': ['About Alankrita | Imitation Jewellery', 'Get to know Alankrita and find care tips for your imitation jewellery.'],
  '/contact': ['Contact Alankrita | WhatsApp and Order Help', 'Contact Alankrita on WhatsApp or Instagram and find answers to common ordering questions.'],
};

export const storefrontPaths = Object.keys(pages);

export function makeSeo(path, { siteOrigin, product, heroImage, unavailable = false } = {}) {
  const detail = Boolean(product && path.startsWith('/product/'));
  const page = pages[path];
  const [title, description] = detail
    ? [`${product.name} | Alankrita Imitation Jewellery`, `Explore ${product.name}, imitation jewellery from Alankrita. Order on WhatsApp.`]
    : page ?? (unavailable
      ? ['Product Unavailable | Alankrita', 'This product is unavailable. Browse the Alankrita shop for more imitation jewellery.']
      : ['Page Not Found | Alankrita', 'Explore the Alankrita shop for imitation jewellery.']);
  const candidate = detail ? product.images?.[0]?.url : path === '/' ? heroImage : undefined;
  let image;
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:' && !url.username && !url.password) image = url.href;
  } catch {
    // An uploaded image is optional and must be an absolute HTTPS URL to share.
  }

  return {
    title,
    description,
    image,
    type: detail ? 'product' : 'website',
    noindex: !detail && !page,
    url: siteOrigin && (detail || page) ? new URL(path, siteOrigin).href : undefined,
  };
}
