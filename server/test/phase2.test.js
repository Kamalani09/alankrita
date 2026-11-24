import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { createImageStore } from '../config/cloudinary.js';
import { Admin, adminId } from '../models/Admin.js';
import { Category } from '../models/Category.js';
import { Enquiry } from '../models/Enquiry.js';
import { Product } from '../models/Product.js';
import { SiteSettings } from '../models/SiteSettings.js';

const uri = process.env.TEST_MONGODB_URI;
const secret = randomBytes(32).toString('hex');
const origin = 'http://localhost:5173';
const siteUrl = 'https://shop.example.invalid';
const shellHtml = '<!doctype html><html><head><title>Alankrita</title></head><body><div id="root"></div></body></html>';
const testImage = {
  url: 'https://example.invalid/image.png',
  publicId: 'alankrita/catalogue/f0000000-0000-4000-8000-000000000000',
};
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWioAAAAASUVORK5CYII=',
  'base64',
);

test('unconfigured image storage returns 503 without contacting Cloudinary', async () => {
  const imageStore = createImageStore({});
  await assert.rejects(imageStore.upload(png), { status: 503 });
  await assert.rejects(imageStore.remove(testImage.publicId), { status: 503 });
});

test('health and input validation work without MongoDB', async () => {
  const server = await listen();
  try {
    const health = await request(server, '/health');
    assert.equal(health.body.data.database, 'disconnected');
    assert.equal((await request(server, '/ready')).status, 503);
    assert.match(health.headers.get('x-content-type-options'), /nosniff/);
    assert.equal((await request(server, '/products')).status, 503);
    assert.equal((await request(server, '/products?stock%5B%24ne%5D=sold_out')).status, 400);
    assert.equal((await request(server, '/products?page=1&page=2')).status, 400);
    assert.equal((await request(server, '/enquiries', { method: 'POST', body: {} })).status, 404);
    const invalid = await request(server, '/admin/login', {
      method: 'POST', body: { email: 'not-an-email', password: 'guess', admin: true },
    });
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.data, null);
    assert.equal(invalid.headers.get('cache-control'), 'no-store');
    const spoof = await request(server, '/admin/login', {
      method: 'POST', body: { email: 'admin@example.invalid', password: { '$ne': '' } },
    });
    assert.equal(spoof.status, 400);
    assert.match(spoof.body.message, /unsupported field names/);
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const preflight = (requestOrigin) => fetch(base + '/admin/login', {
      method: 'OPTIONS',
      headers: { Origin: requestOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
    });
    const allowed = await preflight(origin);
    assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
    assert.match(allowed.headers.get('access-control-allow-headers'), /Content-Type/i);
    const other = await preflight('https://other.example.invalid');
    assert.equal(other.headers.get('access-control-allow-origin'), null);
    assert.match(other.headers.get('vary'), /Origin/i);

    const tooLarge = await request(server, '/admin/login', {
      method: 'POST', body: { email: 'admin@example.invalid', password: 'x'.repeat(65536) },
    });
    assert.equal(tooLarge.status, 413);
    for (let count = 0; count < 7; count += 1) {
      assert.equal((await request(server, '/admin/login', { method: 'POST', body: {} })).status, 400);
    }
    const limited = await request(server, '/admin/login', { method: 'POST', body: {} });
    assert.equal(limited.status, 429);
    assert.ok(limited.headers.get('retry-after'));
  } finally {
    await close(server);
  }
});

test('admin authorization, catalogue lifecycle, settings and image endpoints', {
  skip: !uri && 'Set TEST_MONGODB_URI to run the MongoDB integration test.',
}, async () => {
  // Always use an isolated database, even if the URI contains a database name.
  const dbName = `alankrita_test_${randomBytes(12).toString('hex')}`;
  const email = 'admin@example.invalid';
  const password = randomBytes(18).toString('hex');
  let server;
  try {
    await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
    await Promise.all([Admin.init(), Category.init(), Product.init(), SiteSettings.init(), Enquiry.init()]);
    await Admin.create({ _id: adminId, email, passwordHash: await bcrypt.hash(password, 12), tokenVersion: 'first' });

    const storedImages = new Set();
    server = await listen({
      async upload(buffer) {
        assert.deepEqual(buffer, png);
        storedImages.add(testImage.publicId);
        return testImage;
      },
      async remove(publicId) {
        storedImages.delete(publicId);
      },
    }, { trackEnquiries: true, serveStorefront: true, siteUrl, shellHtml });
    assert.equal((await request(server, '/ready')).status, 200);
    assert.equal((await request(server, '/admin/stats')).status, 401);
    assert.equal((await request(server, '/admin/products', {
      method: 'POST', body: { oversized: 'x'.repeat(65536) },
    })).status, 401);
    assert.equal((await request(server, '/admin/enquiries')).status, 401);
    assert.equal((await request(server, '/admin/stats', { token: 'invalid' })).status, 401);
    assert.equal((await request(server, '/admin/login', {
      method: 'POST', body: { email, password: 'incorrect' },
    })).status, 401);
    const login = await request(server, '/admin/login', {
      method: 'POST', body: { email: email.toUpperCase(), password },
    });
    assert.equal(login.status, 200, login.body.message);
    const { token, admin } = login.body.data;
    assert.deepEqual(admin, { email });

    const create = (path, body) => request(server, path, { token, method: 'POST', body });
    const update = (path, body) => request(server, path, { token, method: 'PUT', body });
    const remove = (path) => request(server, path, { token, method: 'DELETE' });

    function formFor(bytes, field = 'image') {
      const form = new FormData();
      form.append(field, new Blob([bytes], { type: 'image/png' }), 'test.png');
      return form;
    }
    const upload = (body) => request(server, '/admin/upload', { token, method: 'POST', body });
    const deletePath = '/admin/upload/' + encodeURIComponent(testImage.publicId);
    assert.equal((await request(server, '/admin/upload', { method: 'POST', body: formFor(png) })).status, 401);
    assert.equal((await upload({})).status, 415);
    assert.equal((await upload(new FormData())).status, 400);
    assert.equal((await upload(formFor(png, 'wrong'))).status, 400);
    assert.equal((await upload(formFor('invalid image bytes'))).status, 415);
    assert.equal((await upload(formFor(new Uint8Array(5 * 1024 * 1024 + 1)))).status, 413);
    const uploaded = await upload(formFor(png));
    assert.equal(uploaded.status, 201, uploaded.body.message);
    assert.deepEqual(uploaded.body.data, testImage);
    assert.equal((await remove('/admin/upload/other-image')).status, 400);

    const category = await create('/admin/categories', { name: 'Test category' });
    assert.equal(category.status, 201, category.body.message);
    const categoryId = category.body.data._id;
    assert.equal((await create('/admin/categories', { name: 'Test category' })).status, 409);

    const created = await create('/admin/products', {
      name: 'Test imitation jewellery & <sets>',
      price: 199,
      originalPrice: 299,
      category: categoryId,
      occasion: 'party',
      colors: ['Maroon'],
      images: [uploaded.body.data],
    });
    assert.equal(created.status, 201, created.body.message);
    const { _id, slug, productCode } = created.body.data;
    assert.match(productCode, /^ALK-/);
    assert.equal((await request(server, `/products/${slug}`)).status, 404);
    assert.equal((await request(server, '/enquiries', { method: 'POST', body: { product: _id } })).status, 404);
    assert.equal((await request(server, '/products')).body.data.total, 0);
    assert.equal((await request(server, '/admin/products?published=false', { token })).body.data.total, 1);
    assert.equal((await remove(`/admin/categories/${categoryId}`)).status, 409);
    assert.equal((await remove(deletePath)).status, 409);
    assert.equal(storedImages.has(testImage.publicId), true);
    assert.equal((await update(`/admin/products/${_id}`, { price: 300 })).status, 400);
    const published = await update(`/admin/products/${_id}`, { published: true, originalPrice: null });
    assert.equal(published.status, 200, published.body.message);

    const site = `http://127.0.0.1:${server.address().port}`;
    const metadata = await fetch(site + '/product/' + slug);
    assert.equal(metadata.status, 200);
    const productHtml = await metadata.text();
    assert.match(productHtml, /Test imitation jewellery &amp; &lt;sets&gt;/);
    assert.match(productHtml, /property="og:image" content="https:\/\/example\.invalid\/image\.png"/);
    assert.match(productHtml, /rel="canonical" href="https:\/\/shop\.example\.invalid\/product\//);
    const missing = await fetch(site + '/unknown-storefront-page');
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /noindex/);
    assert.equal((await fetch(site + '/api/no-such-api')).status, 404);
    const sitemap = await fetch(site + '/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.ok((await sitemap.text()).includes(siteUrl + '/product/' + slug));
    assert.match(await (await fetch(site + '/robots.txt')).text(), /Disallow: \/admin/);

    assert.equal((await request(server, '/enquiries', { method: 'POST', body: { product: { $ne: null } } })).status, 400);
    assert.equal((await request(server, '/enquiries', { method: 'POST', body: { product: _id } })).status, 201);
    const log = await request(server, '/admin/enquiries', { token });
    assert.equal(log.status, 200);
    assert.equal(log.body.data.items[0].product._id, _id);
    const enquiryStats = await request(server, '/admin/stats', { token });
    assert.equal(enquiryStats.body.data.topEnquiredProducts[0].clicks, 1);

    const detail = await request(server, `/products/${slug}`);
    assert.equal(detail.body.data.images[0].publicId, undefined);
    assert.equal(detail.body.data.category.slug, 'test-category');
    const list = await request(server, '/products?search=Test%20category&color=maroon&maxPrice=200&sort=price_asc');
    assert.equal(list.status, 200, list.body.message);
    assert.equal(list.body.data.total, 1);
    assert.equal((await request(server, '/products?color=.%2A')).body.data.total, 0);
    assert.equal((await request(server, '/admin/stats', { token })).body.data.total, 1);

    const defaults = await request(server, '/settings');
    assert.equal(defaults.body.data.whatsappNumber, '918688371238');
    assert.equal(defaults.body.data.enquiryTrackingEnabled, true);
    const settings = await update('/admin/settings', { heroHeading: 'Updated heading' });
    assert.equal(settings.status, 200, settings.body.message);
    assert.equal((await update('/admin/settings', { announcementEnabled: true })).status, 200);
    assert.equal((await request(server, '/settings')).body.data.heroHeading, 'Updated heading');
    assert.equal(await SiteSettings.countDocuments(), 1);
    assert.equal((await remove(`/admin/products/${_id}`)).status, 200);
    assert.equal((await remove(deletePath)).status, 200);
    assert.equal((await remove(deletePath)).status, 200);
    assert.equal(storedImages.has(testImage.publicId), false);
    assert.equal((await remove(`/admin/categories/${categoryId}`)).status, 200);

    // A concurrent product create and category delete must never leave an orphan.
    const raceCategory = (await create('/admin/categories', { name: 'Race test' })).body.data._id;
    const [raceProduct, raceDelete] = await Promise.all([
      create('/admin/products', { name: 'Race product', price: 99, category: raceCategory, occasion: 'daily' }),
      remove(`/admin/categories/${raceCategory}`),
    ]);
    assert.ok((raceProduct.status === 201 && raceDelete.status === 409) ||
      (raceProduct.status === 400 && raceDelete.status === 200),
    JSON.stringify([raceProduct, raceDelete]));

    await Admin.updateOne({ _id: adminId }, { $set: { tokenVersion: 'rotated' } });
    assert.equal((await request(server, '/admin/stats', { token })).status, 401);
  } finally {
    if (server) await close(server);
    try {
      if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  }
});

async function listen(imageStore, options = {}) {
  const server = createApp(origin, { jwtSecret: secret, imageStore, trackEnquiries: false, serveStorefront: false, ...options })
    .listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server;
}

async function close(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function request(server, path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
    method, headers, body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
