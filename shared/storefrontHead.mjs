export function escapeMarkup(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

export function renderHead(html, seo, imageAlt) {
  const attr = 'data-storefront-meta';
  const meta = (key, value, property = false) => value
    ? `<meta ${attr} ${property ? 'property' : 'name'}="${key}" content="${escapeMarkup(value)}">`
    : '';
  const tags = [
    meta('description', seo.description),
    meta('robots', seo.robots || (seo.noindex ? 'noindex, follow' : undefined)),
    seo.url ? `<link ${attr} rel="canonical" href="${escapeMarkup(seo.url)}">` : '',
    meta('og:site_name', 'Alankrita', true),
    meta('og:locale', 'en_IN', true),
    meta('og:type', seo.type, true),
    meta('og:title', seo.title, true),
    meta('og:description', seo.description, true),
    meta('og:url', seo.url, true),
    meta('og:image', seo.image, true),
    meta('og:image:alt', seo.image && imageAlt, true),
    meta('twitter:card', seo.image ? 'summary_large_image' : 'summary'),
  ].filter(Boolean).join('\n    ');
  return html.replace(/<title>.*?<\/title>/, () => `<title>${escapeMarkup(seo.title)}</title>`)
    .replace('</head>', () => `    ${tags}\n  </head>`);
}
