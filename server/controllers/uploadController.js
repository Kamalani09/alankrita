import { managedPublicId } from '../config/cloudinary.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { ApiError, sendSuccess } from '../utils/http.js';

export function uploadImage(imageStore) {
  return async (request, response) => {
    const image = await imageStore.upload(request.file.buffer);
    return sendSuccess(response, image, 'Image uploaded.', 201);
  };
}

export function deleteImage(imageStore) {
  return async (request, response) => {
    const { publicId } = request.params;
    if (!managedPublicId.test(publicId)) {
      throw new ApiError(400, 'Invalid ALANKRITA image public ID.');
    }
    const references = await Promise.all([
      Product.exists({ 'images.publicId': publicId }),
      Category.exists({ 'image.publicId': publicId }),
      SiteSettings.exists({ 'heroImage.publicId': publicId }),
    ]);
    if (references.some(Boolean)) {
      throw new ApiError(409, 'Remove this image from catalogue records before deleting it.');
    }
    await imageStore.remove(publicId);
    return sendSuccess(response, null, 'Image removed.');
  };
}
