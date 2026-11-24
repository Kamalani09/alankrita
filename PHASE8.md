# ALANKRITA Phase 8 · Security, performance and launch checks

## What changed

- The API sends admin responses with `Cache-Control: no-store`. It allows browser access from `CLIENT_ORIGIN` and limits preflight methods and headers. Protected writes verify authentication before reading the JSON body or buffering an upload.
- JSON payloads are bounded at 64 KiB. Input validation rejects unsupported keys or excessive nesting before building MongoDB queries. Controllers still construct queries from validated fields.
- Uploads keep the existing 5 MiB per-file limit. The API limits upload/delete requests and allows four image uploads to run at once per server process. Login and enquiries have separate rate limits.
- MongoDB has indexes that support published catalogue ordering and category-price sorting. The server initializes them on startup.
- Public Cloudinary images offer several widths through `srcset` and `sizes`, with `f_auto` and `q_auto`. Thumbnails and catalogue cards lazy-load. The hero and the active product image get high priority. Existing third-party or already-transformed URLs are passed through, and failed renditions fall back to the original. [Cloudinary responsive image guide](https://cloudinary.com/documentation/responsive_html)

Keep `TRUST_PROXY_HOPS=0` while connecting directly to Express. Before deployment, confirm the host’s proxy path and set the count only if that path is controlled and consistent. Rate limits currently use in-process storage. A deployment with multiple API instances needs shared storage or gateway enforcement if you want a single limit across instances. [Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/)

## Run the checks

From the project root:

```powershell
npm run build
npm test --workspace server
npm audit
```

To include database integration tests, set `TEST_MONGODB_URI` to a test replica-set connection string before running the server tests. The suite creates a temporary database and removes it when done. The browser and API tests can use simulated image storage and WhatsApp destinations.

## Optional local sample catalogue

To explore the Shop with eight sample products, use a **local** MongoDB instance. Prefer a local replica set if you also want to exercise admin writes and category deletion. Set `DEMO_MONGODB_URI` in the terminal to that instance’s loopback URI with no database name. Adjust the example port and replica-set name if needed.

```powershell
$env:DEMO_MONGODB_URI = 'mongodb://127.0.0.1:27017/?replicaSet=rs0'
npm run seed:demo --workspace server
```

The seed writes only to the local `alankrita_demo` database. It refuses remote URIs and production mode. Rerunning it leaves one record per demo code. Sample products have no images. To preview them through the API, use a temporary PowerShell terminal and set `MONGODB_URI` to your local connection string with `/alankrita_demo` before running `npm run dev:server`. Leave the Atlas settings in `server/.env` as they are.

## Pre-launch checklist

| Check | Expected result |
| --- | --- |
| Admin authorization | Signed-out visitors can’t open admin screens or read admin API data. Wrong credentials fail and repeated attempts are limited. |
| Catalogue visibility | A draft is absent from public lists, direct product URLs and the sitemap. Publishing makes it visible. |
| Image management | JPG, PNG and WebP uploads up to 5 MiB work. Invalid files fail. Removing an image from one product preserves it if another record still uses it. |
| Shop on mobile | Search, filters and pagination work. Product cards fit at 320–390 px and show a usable WhatsApp action. |
| WhatsApp | An order draft carries product name, code, price, colour, quantity and a product URL. A sold-out item opens a similar-items enquiry. Tracking failure leaves the link usable. |
| Image delivery | In browser developer tools, reload under a mobile viewport and confirm catalogue requests use a smaller Cloudinary width and images remain sharp. |
| Accessibility | Use Tab to navigate the menu, filters and order links. Check visible focus, Escape on image zoom, labels, contrast and zoom at 200%. |
| Public metadata | The product’s initial HTML contains its title and share image when served through the storefront renderer. Robots and sitemap use the intended public domain. |
| Deployment gate | In Phase 9, repeat these checks against the HTTPS domain and confirm production CORS, Atlas access and Cloudinary credentials. |

## Source map

- [API configuration](server/app.js), [route limits](server/routes/catalogueRoutes.js), [input validation](server/middleware/validate.js), and [upload capacity](server/middleware/upload.js)
- [Catalogue indexes](server/models/Product.js)
- [Responsive image URL builder](client/src/utils/responsiveImage.js) and [fallback image component](client/src/components/ui/CatalogueImage.jsx)
- [Local-only sample seeder](server/seed/createSampleCatalogue.js)
- [API tests](server/test/phase2.test.js) and [image URL tests](server/test/responsive-image.test.js)

## Interview angle

1. **Why authenticate before reading a protected request body?** Invalid callers are rejected before the server spends time parsing JSON or memory buffering an image.
2. **Why use `srcset` and `sizes` together?** `srcset` lists available image widths and `sizes` describes the image’s layout width. The browser chooses a suitable file for the device.
3. **Why apply the published filter on the server?** It keeps draft data out of public API responses, including requests sent outside the frontend.
