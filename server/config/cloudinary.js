import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from '../utils/http.js';

const publicIdPrefix = 'alankrita/catalogue/';
export const managedPublicId = /^alankrita\/catalogue\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const deliveryOptions = { resource_type: 'image', type: 'upload', timeout: 20000 };

export function createImageStore(env = process.env) {
  const config = {
    cloud_name: env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: env.CLOUDINARY_API_KEY?.trim(),
    api_secret: env.CLOUDINARY_API_SECRET?.trim(),
  };

  function requireConfig() {
    if (!Object.values(config).every(Boolean)) {
      throw new ApiError(503, 'Image storage is not configured.');
    }
  }

  return {
    async upload(buffer) {
      requireConfig();
      const publicId = publicIdPrefix + randomUUID();
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({
            ...config,
            ...deliveryOptions,
            public_id: publicId,
            overwrite: false,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          }, (error, response) => error ? reject(error) : resolve(response));
          stream.once('error', reject);
          stream.end(buffer);
        });

        if (result?.public_id !== publicId || !result.secure_url?.startsWith('https://')) {
          throw new Error('Unexpected image upload response');
        }
        return { url: result.secure_url, publicId };
      } catch {
        throw new ApiError(502, 'Image storage could not complete the upload.');
      }
    },
    async remove(publicId) {
      requireConfig();
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          ...config, ...deliveryOptions, invalidate: true,
        });
        if (result?.result !== 'ok' && result?.result !== 'not found') {
          throw new Error('Unexpected image deletion response');
        }
      } catch {
        throw new ApiError(502, 'Image storage could not complete the deletion.');
      }
    },
  };
}
