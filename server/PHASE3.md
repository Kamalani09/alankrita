# ALANKRITA Phase 3 · Cloudinary images

## Connect Cloudinary

1. Open your Cloudinary Console and go to **Settings → API Keys**. Copy the cloud name, API key and API secret for the same product environment. [Cloudinary Node.js quick start](https://cloudinary.com/documentation/node_quickstart)
2. Open the existing `server/.env` and fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Keep the MongoDB and ALANKRITA admin values already there. Store the Cloudinary credentials on the server only.
3. Restart the API with `npm run dev:server`. Phase 2 routes can still run while Cloudinary is being configured.

On a fresh checkout, run `npm ci` before starting the API. If reinstalling on Windows, stop running ALANKRITA dev servers first so dependency files can be replaced.

## API

| Method and path | Behavior |
| --- | --- |
| `POST /api/admin/upload` | Takes one multipart file in the `image` field. Returns HTTP 201 with `data: { url, publicId }`. |
| `DELETE /api/admin/upload/:publicId` | Takes a URL-encoded ALANKRITA image ID. Returns HTTP 200 if the image is removed or already absent. Returns HTTP 409 if it is still referenced. |

Both routes use the same `Authorization: Bearer <token>` header as the Phase 2 admin APIs. Accepted formats are JPEG, PNG and WebP, up to 5 MiB per file. To upload several product photos, send one request per file and keep the results in display order. The product API accepts up to six metadata entries. Category and hero images use the same shape.

Send the returned metadata to the existing product, category or site settings API to save it in MongoDB. The upload route itself creates the Cloudinary asset. To delete a saved image, first remove its metadata from every record that uses it, then call the delete endpoint. Complete deletion before reusing or uploading a replacement. When cancelling an edit, delete any uploads you made for that edit that were never saved. Cloudinary cache invalidation can take time to propagate. [Cloudinary Upload API](https://cloudinary.com/documentation/image_upload_api_reference)

## Verify a real upload

With the API running, paste this block into a second PowerShell terminal at the project root. Enter the full path to a local JPEG, PNG or WebP when prompted. The script logs in using the existing server environment, uploads the file, prints the HTTPS delivery URL and deletes the temporary asset. It checks that the delivery response succeeded before deleting it.

```powershell
$env:ALANKRITA_TEST_IMAGE = (Read-Host 'c:\Users\Raja_Kamalani\Downloads\lakshmi-bangles-sample.png').Trim('"')
@'
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
const api = 'http://localhost:5000/api';
const path = process.env.ALANKRITA_TEST_IMAGE;

const login = await fetch(api + '/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  }),
});
const loginBody = await login.json();
if (!login.ok) throw new Error(loginBody.message);

const headers = { Authorization: 'Bearer ' + loginBody.data.token };
const form = new FormData();
form.append('image', new Blob([await readFile(path)]), basename(path));

const response = await fetch(api + '/admin/upload', { method: 'POST', headers, body: form });
const upload = await response.json();
if (!response.ok) throw new Error(upload.message);
const { url, publicId } = upload.data;
console.log('Upload verified:', url);

try {
  const delivered = await fetch(url);
  if (!delivered.ok) throw new Error('Image delivery returned HTTP ' + delivered.status);
  await delivered.body?.cancel();
  console.log('Image delivery verified.');
} finally {
  const removed = await fetch(api + '/admin/upload/' + encodeURIComponent(publicId), {
    method: 'DELETE',
    headers,
  });
  if (!removed.ok) throw new Error((await removed.json()).message);
  console.log('Temporary test image removed.');
}
'@ | node --env-file=server/.env --input-type=module
Remove-Item Env:ALANKRITA_TEST_IMAGE
```

Run `npm test --workspace server` for automated checks. Set `TEST_MONGODB_URI` to a test replica-set URI to exercise admin authorization, multipart validation, catalogue references and deletion with a fake image storage service. The automated tests make no Cloudinary API calls.

## Code map

- [Cloudinary configuration](config/cloudinary.js) signs server-side uploads and handles deletion.
- [Upload middleware](middleware/upload.js) limits the request and checks the file signature.
- [Upload controller](controllers/uploadController.js) returns catalogue metadata and checks references before deletion.
- [Admin routes](routes/catalogueRoutes.js) apply authentication before parsing image requests.

## Interview angle

1. **Why check file bytes as well as the request format?** A client controls the uploaded filename and MIME label. Inspecting the file signature helps reject files disguised as images.
2. **Why store both `url` and `publicId`?** The URL delivers the image to customers. The public ID identifies the asset for Cloudinary management operations.
3. **Why cap the upload before sending it to Cloudinary?** Multer buffers the image in server memory. The cap bounds memory per request and rejects oversized files before an external API call.
