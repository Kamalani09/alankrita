import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { ApiError } from '../utils/http.js';

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxImageBytes = 5 * 1024 * 1024;

const parseMultipart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxImageBytes + 1, files: 1, fields: 0 },
}).single('image');

export function limitConcurrentUploads(max) {
  let active = 0;
  return (_request, response, next) => {
    if (active >= max) {
      response.set('Retry-After', '2');
      return next(new ApiError(429, 'Other images are uploading. Try again in a moment.'));
    }
    active += 1;
    response.once('close', () => { active -= 1; });
    return next();
  };
}

export function parseImage(request, response, next) {
  if (!request.is('multipart/form-data')) {
    throw new ApiError(415, 'Send multipart/form-data with one image field.');
  }
  parseMultipart(request, response, (error) => {
    if (error && !(error instanceof multer.MulterError)) {
      return next(new ApiError(400, 'Malformed image upload.'));
    }
    return next(error);
  });
}

export async function validateImage(request, _response, next) {
  if (!request.file?.size) throw new ApiError(400, 'Choose a nonempty image file.');
  if (request.file.size > maxImageBytes) throw new ApiError(413, 'Image must be 5 MiB or smaller.');

  // Detect the type from the bytes. A client can choose its extension and MIME label.
  let detected;
  try {
    detected = await fileTypeFromBuffer(request.file.buffer);
  } catch {
    throw new ApiError(415, 'Send a JPEG, PNG or WebP image.');
  }
  if (!acceptedTypes.has(detected?.mime)) throw new ApiError(415, 'Send a JPEG, PNG or WebP image.');
  next();
}
