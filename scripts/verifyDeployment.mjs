import assert from 'node:assert/strict';

function httpsOrigin(input, label) {
  assert.ok(input, `Provide the ${label} HTTPS origin.`);
  const url = new URL(input);
  assert.ok(url.protocol === 'https:' && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash,
    `Use the ${label} HTTPS origin without a path.`);
  return url.origin;
}

const backend = httpsOrigin(process.argv[2], 'Render');
const frontend = httpsOrigin(process.argv[3], 'Vercel');
const fetchPage = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(45000) });

try {
  const ready = await fetch(backend + '/api/ready', { signal: AbortSignal.timeout(90000) });
  assert.equal(ready.status, 200, 'Render readiness check failed.');
  assert.equal((await ready.json()).data?.status, 'ready');

  const preflight = (origin) => fetchPage(backend + '/api/admin/login', {
    method: 'OPTIONS',
    headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  const allowed = await preflight(frontend);
  assert.equal(allowed.status, 204, 'Render did not accept the Vercel login preflight.');
  assert.equal(allowed.headers.get('access-control-allow-origin'), frontend, 'CLIENT_ORIGIN does not match the site.');
  const denied = await preflight('https://untrusted.example.invalid');
  assert.equal(denied.headers.get('access-control-allow-origin'), null, 'An unrelated origin received CORS permission.');
  console.log('Render readiness and cross-origin policy verified.');

  const home = await fetchPage(frontend + '/');
  assert.equal(home.status, 200, 'Vercel homepage failed.');
  const homeHtml = await home.text();
  assert.ok(homeHtml.includes(frontend + '/'), 'Homepage canonical URL does not match the public domain.');
  const asset = /src="(\/assets\/[^"]+\.js)"/.exec(homeHtml)?.[1];
  assert.ok(asset, 'Homepage does not reference a built script.');
  const script = await fetchPage(frontend + asset);
  assert.equal(script.status, 200, 'The Vercel build asset is missing.');
  assert.match(script.headers.get('content-type') ?? '', /javascript/i, 'The asset response was not JavaScript.');
  await script.body?.cancel();
  const admin = await fetchPage(frontend + '/admin/login');
  assert.equal(admin.status, 200, 'Admin sign-in page route failed.');
  assert.match((await admin.text()), /noindex, nofollow/);
  assert.match(admin.headers.get('cache-control') ?? '', /no-store/);
  const missing = await fetchPage(frontend + '/verification-missing-' + crypto.randomUUID());
  assert.equal(missing.status, 404, 'The storefront missing-page route did not return HTTP 404.');
  await missing.body?.cancel();

  const robots = await fetchPage(frontend + '/robots.txt');
  assert.equal(robots.status, 200);
  assert.ok((await robots.text()).includes(`Sitemap: ${frontend}/sitemap.xml`));
  const sitemap = await fetchPage(frontend + '/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.ok((await sitemap.text()).includes(`<loc>${frontend}/</loc>`));

  const products = await fetchPage(backend + '/api/products?limit=12');
  assert.equal(products.status, 200);
  const items = (await products.json()).data.items;
  const sample = items.find((item) => item.images?.[0]?.url) ?? items[0];
  if (sample) {
    const detail = await fetchPage(frontend + '/product/' + encodeURIComponent(sample.slug));
    assert.equal(detail.status, 200);
    const html = await detail.text();
    assert.match(html, /property="og:title"/);
    if (sample.images?.[0]?.url) assert.match(html, /property="og:image" content="https:\/\//);
    console.log('Published product sharing metadata verified in the initial HTML.');
  } else {
    console.log('Product preview check skipped because the catalogue is empty.');
  }
  console.log('Vercel homepage, build asset, admin route, 404 and discovery files verified.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
