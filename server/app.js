import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createImageStore } from './config/cloudinary.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createCatalogueRoutes } from './routes/catalogueRoutes.js';
import { healthRoutes } from './routes/healthRoutes.js';
import { createStorefrontRoutes, storefrontOrigin } from './routes/storefrontRoutes.js';

export function createApp(clientOrigin = 'http://localhost:5173', {
  jwtSecret = process.env.JWT_SECRET,
  imageStore = createImageStore(),
  trackEnquiries = process.env.ENQUIRY_TRACKING_ENABLED === 'true',
  serveStorefront = process.env.SERVE_STOREFRONT === 'true',
  siteUrl = process.env.SITE_URL,
  trustProxyHops = process.env.TRUST_PROXY_HOPS || '0',
  shellHtml,
} = {}) {
  const app = express();
  const origin = storefrontOrigin(siteUrl, clientOrigin);
  const frontendOrigin = storefrontOrigin(null, clientOrigin);
  if (!/^(?:0|[1-9]|10)$/.test(String(trustProxyHops))) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10.');
  }
  app.set('trust proxy', Number(trustProxyHops));

  app.use(helmet(serveStorefront ? {
    contentSecurityPolicy: { directives: {
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", frontendOrigin],
      upgradeInsecureRequests: origin.startsWith('https:') ? [] : null,
    } },
  } : undefined));
  app.use('/api', (_request, response, next) => {
    response.vary('Origin');
    next();
  });
  app.use(cors({
    origin: (origin, callback) => callback(null, origin === frontendOrigin),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  }));
  app.use('/api', healthRoutes);
  app.use('/api', createCatalogueRoutes(jwtSecret, imageStore, trackEnquiries));
  app.use(createStorefrontRoutes(origin, { serveStorefront, shellHtml }));
  app.use((_request, response) => {
    response.status(404).json({ success: false, data: null, message: 'Route not found.' });
  });
  app.use(errorHandler);

  return app;
}
