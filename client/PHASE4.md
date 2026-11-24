# ALANKRITA Phase 4 · Admin panel

## Start the panel

Use the existing `server/.env` settings from Phases 2 and 3. Keep the backend and frontend running in separate PowerShell terminals from the project root.

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open [the admin sign-in page](http://localhost:5173/admin/login) and use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` for the account you seeded. If the API is hosted at a different URL, set `VITE_API_BASE_URL` in `client/.env` and restart Vite. The JWT lives in React memory. Reloading the page or signing out clears it.

## Use and test the admin panel

1. **Dashboard** shows the current product, stock and featured counts. Open Products or Categories using the navigation.
2. **Categories** lets you add, edit and delete categories. Use the display order field to reorder them. Lower numbers appear first, and matching numbers are sorted by name.
3. **Products** lets you add a product after creating its category, then search, filter, edit, duplicate, quickly change stock, or delete it. Duplicating opens a prefilled draft with a new name and generated code and slug. The copy is created only when you save it.
4. **Images** can be selected or dropped onto the form. Review the previews and use the move and primary controls to set the order. Product forms accept up to six images. The first image is primary. New files upload when you save the record, so cancelling before saving sends no images to Cloudinary.
5. **Site settings** manages the announcement, hero, trust items, contact details, About content and FAQs. Edit an item and save, then revisit the page to confirm it persisted.
6. **Sign out** and open [the dashboard URL](http://localhost:5173/admin) directly. You should return to sign-in.

Use a draft when verifying with a temporary product. Deleting products and categories asks for confirmation. Replacing or removing an image saves the record first, then tries to remove the previous Cloudinary asset if no catalogue record still references it. The panel reports a cleanup warning if it cannot confirm deletion.

The enquiry section can be added when tracking is implemented. Settings are saved through the API for the public layout in the following phase.

## Source map

- [Admin routes and sign-in](src/pages/admin/AdminApp.jsx)
- [Session context](src/context/AdminSession.jsx)
- [Dashboard](src/pages/admin/Dashboard.jsx)
- [Product list and editor](src/pages/admin/Products.jsx)
- [Categories](src/pages/admin/Categories.jsx)
- [Site settings](src/pages/admin/Settings.jsx)
- [Image picker](src/components/admin/ImagePicker.jsx) and [upload/save flow](src/utils/adminImages.js)
- [Admin styling](src/styles/admin.css)

Run `npm run build` to compile the app. For backend regression tests, see the [Phase 2 test instructions](../server/PHASE2.md).

## Interview angle

1. **Why have a route guard and an API guard?** The route guard directs unauthenticated users to sign-in. The API guard independently verifies the JWT on every protected request, including requests sent outside the browser.
2. **Why keep the token in React memory?** It avoids persistent browser storage and clears the token on refresh. Reopening or reloading the app requires signing in again.
3. **Why upload images on save and remove old ones after the record is updated?** Waiting on save avoids uploads when the admin cancels. Updating MongoDB first keeps the old image available until the saved record no longer needs it.
