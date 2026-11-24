import { json, Router } from 'express';
import { body, query } from 'express-validator';
import { rateLimit } from 'express-rate-limit';
import { login } from '../controllers/authController.js';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js';
import { createProduct, deleteProduct, getAdminProduct, getPublicProduct, listProducts, updateProduct } from '../controllers/productController.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { getStats } from '../controllers/statsController.js';
import { listEnquiries, recordEnquiry } from '../controllers/enquiryController.js';
import { deleteImage, uploadImage } from '../controllers/uploadController.js';
import { requireAdmin } from '../middleware/auth.js';
import { requireDatabase } from '../middleware/requireDatabase.js';
import { limitConcurrentUploads, parseImage, validateImage } from '../middleware/upload.js';
import { idParam, slugParam, validate } from '../middleware/validate.js';
import { categoryInput, loginInput, productInput, productQuery, settingsInput } from './validators.js';

const parseJson = json({ limit: '64kb', inflate: false });

export function createCatalogueRoutes(jwtSecret, imageStore, trackEnquiries = false) {
  const router = Router();
  const admin = Router();

  router.get('/products', productQuery(), requireDatabase, listProducts());
  router.get('/products/:slug', slugParam, requireDatabase, getPublicProduct);
  router.get('/categories', requireDatabase, listCategories());
  router.get('/settings', requireDatabase, getSettings(false, trackEnquiries));
  if (trackEnquiries) {
    const limitEnquiries = rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { success: false, data: null, message: 'Enquiry tracking limit reached.' },
    });
    router.post('/enquiries', limitEnquiries, parseJson,
      validate([body('product').isString().bail().isMongoId()]), requireDatabase, recordEnquiry);
  }

  const limitLogins = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, data: null, message: 'Too many login attempts. Try again later.' },
  });
  admin.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  admin.post('/login', limitLogins, parseJson, loginInput, requireDatabase, login(jwtSecret));
  admin.use(requireDatabase, requireAdmin(jwtSecret));
  admin.get('/stats', getStats(trackEnquiries));
  if (trackEnquiries) {
    admin.get('/enquiries', validate([query('page').optional().isString().bail().isInt({ min: 1, max: 1000 }).toInt()], 'query'), listEnquiries);
  }
  admin.get('/products', productQuery(true), listProducts(true));
  admin.get('/products/:id', idParam, getAdminProduct);
  admin.post('/products', parseJson, productInput(true), createProduct);
  admin.put('/products/:id', idParam, parseJson, productInput(), updateProduct);
  admin.delete('/products/:id', idParam, deleteProduct);
  admin.get('/categories', listCategories(true));
  admin.post('/categories', parseJson, categoryInput(true), createCategory);
  admin.put('/categories/:id', idParam, parseJson, categoryInput(), updateCategory);
  admin.delete('/categories/:id', idParam, deleteCategory);
  admin.get('/settings', getSettings(true));
  admin.put('/settings', parseJson, settingsInput, updateSettings);

  const limitImageChanges = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, data: null, message: 'Too many image changes. Try again later.' },
  });
  admin.post('/upload', limitImageChanges, limitConcurrentUploads(4), parseImage, validateImage, uploadImage(imageStore));
  admin.delete('/upload/:publicId', limitImageChanges, deleteImage(imageStore));

  router.use('/admin', admin);
  return router;
}
