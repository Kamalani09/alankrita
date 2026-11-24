import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { renderHead } from '../shared/storefrontHead.mjs';
import { makeSeo, storefrontPaths } from '../shared/storefrontSeo.mjs';

const shellFile = resolve(process.cwd(), 'client/dist/index.html');
const imageFallback = 'Alankrita imitation jewellery collection';

function apiBase(value) {
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      !/^\/api\/?$/.test(url.pathname) || url.username || url.password || url.search || url.hash) {
    throw new Error('Set VITE_API_BASE_URL to the absolute HTTPS Render API URL, ending in /api.');
  }
  return url;
}

function publicOrigin(value, requestUrl) {
  if (!value) return requestUrl.origin;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('Set VITE_SITE_URL to the public website origin.');
  }
  return url.origin;
}

function upstream(url, method = 'GET') {
  return fetch(url, { method, redirect: 'error', signal: AbortSignal.timeout(8000) });
}

function browserPolicy(backend) {
  const connect = backend ? `connect-src 'self' ${backend.origin}` : "connect-src 'self'";
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    connect,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join('; ');
}

function plain(message, status) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const requestUrl = new URL(request.url);
    const routedPath = requestUrl.searchParams.get('__storefront_path') ?? requestUrl.pathname;
    const path = routedPath.startsWith('/') ? routedPath.replace(/\/+$/, '') || '/' : '/not-found';
    try {
      const siteOrigin = publicOrigin(process.env.VITE_SITE_URL, requestUrl);
      const backend = process.env.VITE_API_BASE_URL ? apiBase(process.env.VITE_API_BASE_URL) : null;
      if (path === '/robots.txt') {
        const robots = `User-agent: *\nDisallow: /admin\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n`;
        return new Response(request.method === 'HEAD' ? null : robots, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
        });
      }
      if (path === '/sitemap.xml') {
        if (!backend) return plain('Discovery file temporarily unavailable.', 503);
        const result = await upstream(new URL(path, backend), request.method);
        if (!result.ok) return plain('Discovery file temporarily unavailable.', 503);
        return new Response(request.method === 'HEAD' ? null : result.body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      }

      const admin = /^\/admin(?:\/|$)/.test(path);
      const slug = /^\/product\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path)?.[1];
      const html = await readFile(shellFile, 'utf8');
      let status = admin || storefrontPaths.includes(path) ? 200 : 404;
      let product, heroImage;
      if ((slug && slug.length <= 120) || path === '/') {
        try {
          if (!backend) throw new Error('Render API URL is missing.');
          const base = backend.href.replace(/\/$/, '');
          const url = slug ? base + '/products/' + encodeURIComponent(slug) : base + '/settings';
          const result = await upstream(url);
          if (result.ok) {
            const { success, data } = await result.json();
            if (!success || !data) throw new Error('Unexpected storefront data.');
            if (slug) {
              product = data;
              status = 200;
            } else {
              heroImage = data.heroImage?.url;
            }
          } else if (slug && result.status !== 404) {
            status = 503;
          }
        } catch {
          if (slug) status = 503;
        }
      }

      const seo = admin
        ? { title: 'ALANKRITA Admin', robots: 'noindex, nofollow' }
        : status === 503
          ? { title: 'Product Temporarily Unavailable | Alankrita' }
          : makeSeo(path, { siteOrigin, product, heroImage, unavailable: path.startsWith('/product/') });
      return new Response(request.method === 'HEAD' ? null : renderHead(html, seo, product?.name || imageFallback), {
        status,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': admin || status === 503 ? 'no-store' : 'no-cache',
          'Content-Security-Policy': browserPolicy(backend),
          ...(status === 503 ? { 'Retry-After': '10' } : {}),
        },
      });
    } catch {
      return plain('Storefront temporarily unavailable.', 503);
    }
  },
};
