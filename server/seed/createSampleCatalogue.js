import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

const examples = [
  ['Beadwork Necklace', 'necklaces', 'festive', 399, 'Maroon', { featured: true }],
  ['Pendant Necklace', 'necklaces', 'daily', 249, 'Cream', {}],
  ['Lotus Jhumkas', 'earrings', 'party', 299, 'Maroon', { featured: true }],
  ['Classic Studs', 'earrings', 'daily', 149, 'Black', { stockStatus: 'low_stock' }],
  ['Leaf Pattern Bangles', 'bangles', 'festive', 349, 'Green', {}],
  ['Wedding Bangle Set', 'bangles', 'bridal', 699, 'Red', { stockStatus: 'sold_out' }],
  ['Necklace and Earrings Set', 'sets', 'party', 549, 'Pink', { combo: true }],
  ['Festive Jewellery Combo', 'sets', 'festive', 899, 'Maroon', { combo: true }],
];

const categories = { necklaces: 'Necklaces', earrings: 'Earrings', bangles: 'Bangles', sets: 'Combo Sets' };

async function seed() {
  const uri = process.env.DEMO_MONGODB_URI?.trim() ?? '';
  // This command is deliberately isolated from the shop's Atlas connection.
  if (process.env.NODE_ENV === 'production' ||
      !/^mongodb:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/(?:\?[^#]*)?$/.test(uri)) {
    throw new Error('Use a loopback MongoDB URI without a database name in DEMO_MONGODB_URI.');
  }

  await mongoose.connect(uri, { dbName: 'alankrita_demo', serverSelectionTimeoutMS: 5000 });
  await Promise.all([Category.init(), Product.init()]);
  const ids = new Map();
  for (const [slug, name] of Object.entries(categories)) {
    const category = await Category.findOneAndUpdate({ slug }, { $setOnInsert: { name, slug } },
      { upsert: true, returnDocument: 'after', runValidators: true });
    ids.set(slug, category._id);
  }

  for (const [index, [name, category, occasion, price, color, flags]] of examples.entries()) {
    const productCode = `DEMO-${String(index + 1).padStart(2, '0')}`;
    await Product.updateOne({ productCode }, {
      $setOnInsert: {
        productCode,
        name: `Sample ${name}`,
        slug: productCode.toLowerCase() + '-' + name.toLowerCase().replaceAll(' ', '-'),
        category: ids.get(category),
        occasion,
        price,
        description: 'Sample imitation jewellery for local testing.',
        colors: [color],
        published: true,
        ...flags,
      },
    }, { upsert: true, runValidators: true });
  }
  console.info('Eight sample products are ready in the local alankrita_demo database.');
}

try {
  await seed();
} catch (error) {
  console.error(error.message === 'Use a loopback MongoDB URI without a database name in DEMO_MONGODB_URI.'
    ? error.message
    : `Sample catalogue could not be created (${error.code ?? error.name}).`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
