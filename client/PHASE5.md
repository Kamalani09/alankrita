# ALANKRITA Phase 5 · Public homepage

## Run locally

In separate PowerShell terminals at the project root:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open [the public homepage](http://localhost:5173/) and [the admin panel](http://localhost:5173/admin/login). Phase 5 reads the existing API, so use the same MongoDB, admin and Cloudinary setup from the earlier phases.

## What appears on the homepage

- The announcement, hero headline, sub-line, image, trust items, contact details and About text come from site settings. The announcement requires both the toggle and text. The trust strip uses the items you entered in the admin panel.
- The category grid comes from the category API. Featured products and combos use their respective admin flags. New Arrivals lists the eight most recently created published products.
- The shop navigation, category tiles, search, budget choices and occasion choices now link to the [Phase 6 Shop](PHASE6.md). Filters are in the URL, so the results can be shared.
- The WhatsApp buttons use the number in site settings and prefill general or bulk enquiries. Payment and delivery details are handled in WhatsApp. The floating chat button remains available while scrolling.
- The hero works with or without an uploaded image. Product images are taken from the first saved image on each product. Empty shelves and missing images use the real empty state.

## Verify

1. In the admin panel, enable an announcement and enter text. Save and refresh the homepage to see it. Turn the announcement off and refresh to check that it disappears.
2. Add a category and publish a product if you want to verify the catalogue with your own content. Mark it featured or combo to see it in the corresponding section. A draft stays out of public results.
3. Use Search, a category tile and an occasion link. The Shop URL should update, and the results should reflect the filters.
4. Resize the browser to mobile width. Verify that the menu opens and closes, and that the product grid uses two columns on mobile, three on tablet and four on desktop.
5. Open a WhatsApp link to check the prefilled text. You can close WhatsApp without sending the message.
6. Run `npm run build` from the project root to compile the frontend.

## Source map

- [Homepage sections](src/pages/public/HomePage.jsx)
- [Navigation, footer and WhatsApp controls](src/components/layout/PublicLayout.jsx)
- [Product card](src/components/product/ProductCard.jsx)
- [Public API data hook](src/hooks/usePublicData.js)
- [WhatsApp link builder](src/utils/whatsapp.js)
- [Public styles](src/styles/public.css)

## Interview angle

1. **Why read the catalogue through the public API?** The backend applies the published filter before sending records. Visitors receive only products intended for display.
2. **Why put filters in the URL?** The browser can share, bookmark or go back to a result set because the filter state is represented in the address.
3. **Why use separate loading and error states for catalogue requests?** Each section can finish independently. A failed category request can be retried while the rest of the homepage stays usable.
