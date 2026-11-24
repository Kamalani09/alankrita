# ALANKRITA Phase 7 · Public pages, previews and enquiries

## Use the new pages

Start `npm run dev:server` and `npm run dev:client` in separate terminals from the project root.

- [About](http://localhost:5173/about) shows the editable story and imitation jewellery care tips.
- [Contact](http://localhost:5173/contact) shows the WhatsApp and Instagram links, address, email, hours, and the FAQ entries saved in Site settings.
- [A missing page](http://localhost:5173/missing-page) shows a link back to the Shop.

## Enable WhatsApp enquiry tracking

Tracking is off by default. To enable it, add this to `server/.env`, then stop and restart the backend.

```dotenv
ENQUIRY_TRACKING_ENABLED=true
```

Open a published product and select **Order on WhatsApp** once. You can close the tab or app without sending the draft. Refresh the admin dashboard and open **View enquiry log** under **Most enquired products**.

The count represents product link clicks. The event contains a product ID and timestamp. The browser opens WhatsApp normally and sends the event in the background. A failed or rate-limited tracking request leaves the order link usable.

## Verify sharing previews without JavaScript

The Vite frontend updates metadata as you navigate. To verify what WhatsApp or another crawler receives before JavaScript runs, build the frontend and enable Express storefront serving. Stop an existing API on port 5000 first, then run these in PowerShell from the project root:

```powershell
npm run build
$env:SERVE_STOREFRONT = 'true'
$env:SITE_URL = 'http://localhost:5000'
npm run dev:server
```

Open [the Express-served storefront](http://localhost:5000/). From a second terminal, paste one of your product URLs and view its response:

```powershell
$productUrl = Read-Host 'Full product URL on localhost:5000'
(Invoke-WebRequest -UseBasicParsing $productUrl).Content | Select-String 'og:image|og:title|canonical'
```

Expect a unique title, description and canonical URL. A product with a saved image also has an absolute HTTPS Open Graph image URL. The API serves [robots.txt](http://localhost:5000/robots.txt) and [the sitemap](http://localhost:5000/sitemap.xml). The sitemap includes published products and public pages. Unknown storefront routes respond with HTTP 404 in this mode.

Live sharing previews need a publicly reachable domain. On a split frontend and backend deployment, the public origin needs to serve or route initial product HTML and discovery files to the Express storefront renderer. Configure `SITE_URL` on the server and use the same origin in `VITE_SITE_URL` for browser metadata. For Express serving both the API and storefront, build with `VITE_API_BASE_URL=/api` or use the production default by leaving that client variable unset.

## Source map

- [About page](src/pages/public/AboutPage.jsx), [Contact page](src/pages/public/ContactPage.jsx), and [404 page](src/pages/public/NotFoundPage.jsx)
- [Browser metadata](src/components/layout/PageSeo.jsx) and [shared metadata definitions](../shared/storefrontSeo.mjs)
- [Server metadata and discovery routes](../server/routes/storefrontRoutes.js)
- [Click tracking](src/components/product/ProductOrder.jsx), [enquiry model](../server/models/Enquiry.js), [enquiry endpoints](../server/controllers/enquiryController.js), and [admin log](src/pages/admin/Enquiries.jsx)

Run `npm test --workspace server` for automated checks. As in earlier phases, set `TEST_MONGODB_URI` to include the replica-set integration tests.

## Interview angle

1. **Why generate Open Graph tags on the server?** A link preview crawler can read the initial HTML even if it never runs React.
2. **How does click tracking stay independent of ordering?** It starts a background request without cancelling or awaiting the browser’s WhatsApp navigation.
3. **Why keep draft URLs out of the sitemap?** The sitemap should point crawlers to public pages. The published filter keeps internal catalogue entries out of discovery.
