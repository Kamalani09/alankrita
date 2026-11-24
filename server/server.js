import { once } from 'node:events';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { hasJwtSecret } from './middleware/auth.js';
import { Admin } from './models/Admin.js';
import { Category } from './models/Category.js';
import { Enquiry } from './models/Enquiry.js';
import { Product } from './models/Product.js';
import { SiteSettings } from './models/SiteSettings.js';

const port = Number(process.env.PORT ?? 5000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const mongoUri = process.env.MONGODB_URI?.trim();

async function start() {
  if ((process.env.JWT_SECRET || process.env.NODE_ENV === 'production') && !hasJwtSecret(process.env.JWT_SECRET)) {
    console.error('JWT_SECRET must contain at least 32 bytes.');
    process.exitCode = 1;
    return;
  }
  if (mongoUri) {
    await connectDatabase(mongoUri);
    // Wait for unique indexes before accepting any writes.
    const models = [Admin, Category, Product, SiteSettings];
    if (process.env.ENQUIRY_TRACKING_ENABLED === 'true') models.push(Enquiry);
    await Promise.all(models.map((model) => model.init()));
    console.info('MongoDB connected.');
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  } else {
    console.info('MONGODB_URI is empty. Starting in local health-check mode.');
  }

  // Wait for a configured database before accepting requests.
  const server = createApp(clientOrigin).listen(port, '0.0.0.0');
  await once(server, 'listening');
  console.info(`ALANKRITA API listening on port ${port}.`);

  let stopping = false;
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    const forceClose = setTimeout(() => server.closeAllConnections(), 8000);
    forceClose.unref();
    try {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await mongoose.disconnect();
    } catch {
      process.exitCode = 1;
      console.error('API shutdown could not finish cleanly.');
    } finally {
      clearTimeout(forceClose);
    }
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

try {
  await start();
} catch (error) {
  // Driver errors can include connection details. Log only safe identifiers.
  console.error(`API startup failed (${error.code ?? error.name}). Check PORT and MongoDB configuration.`);
  process.exit(1);
}
