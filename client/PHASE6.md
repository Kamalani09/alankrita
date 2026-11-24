# ALANKRITA Phase 6 · Shop and WhatsApp orders

## Run locally

Start the backend and frontend in separate PowerShell terminals at the project root.

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open the [homepage](http://localhost:5173/) or the [Shop](http://localhost:5173/shop). Publish a product in the [admin panel](http://localhost:5173/admin/login) to make it visible in the Shop. Mark it featured to include it on the homepage's Featured Products shelf.

## What to check

1. On a homepage card, choose a colour if available, then open **Order on WhatsApp**. Confirm the draft includes the product name, code, colour, quantity, unit price and product URL. Card orders use quantity one.
2. Open the product by selecting its name or image. Check the gallery thumbnails and zoom, then choose a quantity and confirm the new quantity appears in the WhatsApp draft. **Copy product link** shares the product page URL.
3. A sold-out product offers **Ask for similar** and prefills an availability enquiry. A combo product uses the combo order wording. Opening the draft leaves the customer in control of sending it.
4. On the Shop, try the search, category, price, colour, occasion, availability or combo filters. Select **Apply filters**. Sorting and pagination preserve applied filters in the URL. Filter results show only published products.
5. In the admin panel, mark a test product as draft. Its direct product URL should show **Product unavailable** after refresh.
6. From the project root, run `npm run build` to compile the frontend.

The shop filters use the existing API. The WhatsApp number comes from Site settings and the API fallback configuration. WhatsApp handles the conversation for availability, delivery and payment.

## Source map

- [Shop and filters](src/pages/public/ShopPage.jsx)
- [Product detail and gallery](src/pages/public/ProductPage.jsx)
- [Shared product cards](src/components/product/ProductCard.jsx)
- [Order options](src/components/product/ProductOrder.jsx) and [message builder](src/utils/whatsapp.js)
- [Catalogue URLs](src/utils/catalogue.js) and [shared storefront](src/pages/public/Storefront.jsx)
- [Shop and product styles](src/styles/shop.css)

## Interview angle

1. **Why put filters and pagination in the URL?** Customers can bookmark a result, share it, or navigate back to it. The URL also tells the API exactly which page and filters to return.
2. **Why build WhatsApp messages from the selected product and options?** The same builder can format card and detail orders consistently, while the selected colour, quantity and product URL give the merchant the information needed to reply.
3. **Why handle a missing product before rendering its details?** A saved link might point to a deleted or unpublished product. The API returns an unavailable response and the page gives the customer a route back to the Shop.
