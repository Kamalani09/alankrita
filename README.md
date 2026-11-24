# ALANKRITA

A MERN catalogue for Alankrita's imitation jewellery. The public homepage reads published data from the API, and the admin panel manages products, categories and site settings.

[Phase 2 backend setup and API reference](server/PHASE2.md)

[Phase 3 Cloudinary setup and upload test](server/PHASE3.md)

[Phase 4 admin panel guide](client/PHASE4.md)

[Phase 5 public homepage guide](client/PHASE5.md)

[Phase 6 Shop and WhatsApp ordering guide](client/PHASE6.md)

[Phase 7 public pages, sharing previews and enquiries guide](client/PHASE7.md)

[Phase 8 security, performance and launch checks](PHASE8.md)

[Phase 9 deployment guide](DEPLOYMENT.md)

## Run locally on Windows

Use Node.js 22.12+ in the 22.x release line, or Node.js 24.x, with npm. Run these commands in PowerShell from the project root:

```powershell
npm ci
Copy-Item client/.env.example client/.env
Copy-Item server/.env.example server/.env
```

Run each dev command in its own terminal:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Open [the development health page](http://localhost:5173/dev/health) and select **Check API**. With an empty `MONGODB_URI`, the expected result is **API is running. MongoDB is disconnected.** This local mode lets you verify React, Axios and Express before configuring Atlas.

## Connect MongoDB Atlas

Create an Atlas database user and allow your current IP in the Atlas project. Set `MONGODB_URI` in `server/.env` to your Atlas driver connection string, including the `alankrita` database name before the query string. If the credentials contain URL-reserved characters, percent-encode those characters. Restart the server and select **Check API** again. Expect **API is running. MongoDB is connected.**

The server requires a URI and JWT secret in production. If you supply a URI in any environment, it waits for Mongoose to connect before listening and exits with a sanitized error if the connection fails. Restart the server after editing its environment file.

## Verify Phase 1

```powershell
Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 4
curl.exe -i http://localhost:5000/api/health -H "Origin: http://localhost:5173"
curl.exe -i http://localhost:5000/api/health -H "Origin: http://localhost:9999"
curl.exe -i http://localhost:5000/api/missing
npm run build
```

- Health responds with HTTP 200 and a JSON envelope containing `success`, `data` and `message`. The route reports API liveness, with the database state shown separately.
- The first Origin receives `Access-Control-Allow-Origin: http://localhost:5173`. The second receives no CORS permission header. CORS controls which browser origins can read a response.
- The unknown API route responds with HTTP 404 and the same JSON envelope shape.
- The frontend build produces `client/dist/`. Use `npm run preview --workspace client` to inspect the bundle. The health button is visible on the development client.
- Check the logo in the header and footer, the tab favicon, and keyboard focus on the logo link and health button.

## Source map

| Path | Purpose |
| --- | --- |
| `package.json`, `package-lock.json` | Workspace scripts and reproducible dependency installation |
| `client/.env.example`, `client/src/config/brand.js` | Public business values and centralized brand copy |
| `client/index.html`, `client/vite.config.js` | HTML entry, fonts, favicon registration and Vite setup |
| `client/src/main.jsx`, `client/src/App.jsx` | React mount, router and document metadata provider |
| `client/src/pages/public/FoundationPage.jsx`, `client/src/api/client.js` | Starter page and Axios health round trip |
| `client/src/components/layout/Logo.jsx`, `client/public/favicon.svg` | Supplied inline mark and matching favicon |
| `client/src/styles/` | Exact design tokens, global styles and starter layout |
| `server/.env.example`, `server/config/db.js` | Server environment template and Mongoose connection |
| `server/server.js`, `server/app.js` | Startup and Express composition |
| `server/routes/healthRoutes.js`, `server/controllers/healthController.js` | Health endpoint and response |
| `server/middleware/errorHandler.js` | Central error response |

The app factory configures routes and middleware independently of startup, which makes the Express app easier to test. The route maps the request to a controller, while the database module manages the Mongoose connection. The browser reads its API base URL through Vite. Keep real credentials in `server/.env`. All `VITE_` values can be bundled into browser code.

## Interview angle

1. **Why separate `app.js` and `server.js`?** The first creates the Express application, which can be tested in isolation. The second owns process startup, MongoDB connection and port binding.
2. **Why can health return HTTP 200 when MongoDB is disconnected?** A liveness endpoint answers whether the process can serve HTTP. Database readiness is a separate question. The response reports both signals, and startup waits for MongoDB when a URI is configured.
3. **Why are brand contacts allowed in `VITE_` variables but a MongoDB URI stays on the server?** Vite exposes those variables to browser code. Brand contacts are public, while the database credentials grant access and belong in the server environment.
