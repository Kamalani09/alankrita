import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import { escapeMarkup, renderHead } from '../../shared/storefrontHead.mjs';
import { makeSeo, storefrontPaths } from '../../shared/storefrontSeo.mjs';
import { isDatabaseConnected } from '../config/db.js';
import { Product } from '../models/Product.js';
import { SiteSettings, settingsId } from '../models/SiteSettings.js';

const dist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
const shellPath = fileURLToPath(new URL('../../client/dist/index.html', import.meta.url));
const assetsPath = fileURLToPath(new URL('../../client/dist/assets/', import.meta.url));

export function storefrontOrigin(configured, fallback) {
  const url = new URL(configured || fallback);
  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('SITE_URL must be an HTTP(S) origin.');
  }
  return url.origin;
}

export function createStorefrontRoutes(siteOrigin, { serveStorefront, shellHtml } = {}) {
  const router = Router();

  router.get('/robots.txt', (_request, response) => {
    return response.type('text/plain').send(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  });

  router.get('/sitemap.xml', async (_request, response) => {
    if (!isDatabaseConnected()) return response.status(503).type('text/plain').send('Sitemap temporarily unavailable.');
    const products = await Product.find({ published: true }).select('slug updatedAt -_id')
      .sort({ _id: 1 }).limit(50000 - storefrontPaths.length).lean();
    const paths = [
      ...storefrontPaths.map((path) => ({ path })),
      ...products.map(({ slug, updatedAt }) => ({ path: '/product/' + encodeURIComponent(slug), updatedAt })),
    ];
    const links = paths.map(({ path, updatedAt }) => {
      const lastmod = updatedAt ? `<lastmod>${updatedAt.toISOString()}</lastmod>` : '';
      return `  <url><loc>${escapeMarkup(new URL(path, siteOrigin).href)}</loc>${lastmod}</url>`;
    });
    return response.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${links.join('\n')}\n</urlset>\n`,
    );
  });

  if (!serveStorefront) return router;

  const html = shellHtml ?? readFileSync(shellPath, 'utf8');
  router.use('/assets', express.static(assetsPath, {
    immutable: true, maxAge: '1y', index: false,
  }));
  router.get('/favicon.svg', (_request, response) => response.sendFile('favicon.svg', { root: dist }));

  router.get('/{*path}', async (request, response, next) => {
    const path = request.path.replace(/\/+$/, '') || '/';
    if (/^\/(?:api|assets)(?:\/|$)/.test(path)) return next();
    const admin = /^\/admin(?:\/|$)/.test(path);
    const slug = /^\/product\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path)?.[1];
    const productPath = path.startsWith('/product/');
    let product, heroImage;
    let status = admin || storefrontPaths.includes(path) ? 200 : 404;

    if (slug && slug.length <= 120) {
      if (isDatabaseConnected()) {
        product = await Product.findOne({ slug, published: true }).select('name images.url').lean();
        if (product) status = 200;
      } else {
        status = 503;
      }
    } else if (path === '/' && isDatabaseConnected()) {
      const settings = await SiteSettings.findById(settingsId).select('heroImage.url').lean();
      heroImage = settings?.heroImage?.url;
    }

    const seo = admin
      ? { title: 'ALANKRITA Admin', robots: 'noindex, nofollow' }
      : makeSeo(path, { siteOrigin, product, heroImage, unavailable: productPath });
    response.set('Cache-Control', admin ? 'no-store' : 'no-cache');
    return response.status(status).type('html').send(renderHead(html, seo, product?.name || 'Alankrita imitation jewellery collection'));
  });

  return router;
}
