import assert from 'node:assert/strict';
import { test } from 'node:test';
import { responsiveImage } from '../../client/src/utils/responsiveImage.js';

test('versioned Cloudinary uploads get automatic format, quality and appropriate widths', () => {
  const source = 'https://res.cloudinary.com/alankrita/image/upload/v123/catalogue/bangle.png';
  const card = responsiveImage(source, 'card');
  assert.equal(card.src, 'https://res.cloudinary.com/alankrita/image/upload/c_limit,w_480,f_auto,q_auto/v123/catalogue/bangle.png');
  assert.match(card.srcSet, /c_limit,w_180,f_auto,q_auto\/v123\/catalogue\/bangle\.png 180w/);
  assert.match(card.srcSet, /800w$/);
  assert.match(card.sizes, /max-width: 640px/);
  assert.equal(responsiveImage(source, 'thumbnail').sizes, '48px');
  assert.match(responsiveImage(source, 'zoom').srcSet, /1600w$/);
});

test('custom, signed, pre-transformed and tokenized image URLs are preserved', () => {
  for (const source of [
    'https://images.example.invalid/photo.png',
    'https://res.cloudinary.com.example.invalid/alankrita/image/upload/v123/photo.png',
    'https://res.cloudinary.com/alankrita/image/upload/s--SIG--/v123/photo.png',
    'https://res.cloudinary.com/alankrita/image/upload/w_100/v123/photo.png',
    'https://res.cloudinary.com/alankrita/image/upload/v123/photo.png?token=example',
  ]) {
    assert.deepEqual(responsiveImage(source, 'card'), { src: source });
  }
});
