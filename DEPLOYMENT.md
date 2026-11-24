# ALANKRITA Phase 9 · Deployment

Render runs the Express API and connects to your existing MongoDB Atlas database and Cloudinary account. Vercel serves the React build and generates the initial page metadata from the public API. Browser requests, including image uploads, go directly to Render.

## 1. Put the project in a GitHub repository

Create an empty GitHub repository for the source code. A private repository works if you grant Render and Vercel access. Import the project root in both services so they can see the npm workspace, lockfile and shared code.

If this folder has no Git repository yet, run the following in PowerShell from the project root and review the staged file list before committing:

```powershell
git init -b main
git add .
git diff --cached --name-only
```

The staged list should include `render.yaml`, `vercel.json`, `api/`, `client/`, `server/`, `shared/` and the root lockfile. The actual `.env` files and `node_modules` are ignored. Files ending in `.env.example` are templates and can be committed.

After reviewing, commit and push using the HTTPS URL shown on your GitHub repository:

```powershell
git commit -m "Prepare ALANKRITA for deployment"
$repoUrl = Read-Host 'Paste the GitHub repository HTTPS URL'
git remote add origin $repoUrl
git push -u origin main
```

## 2. Deploy the API to Render

In Render, create a **Blueprint** from the GitHub repository. The [Render configuration](render.yaml) uses a Singapore Free web service, installs server dependencies from the lockfile, and checks `/api/ready`. Choose a different region or plan in the Blueprint if needed for your existing Atlas region or launch requirements. Render Free services can take time to wake after inactivity. [Blueprint setup](https://render.com/docs/infrastructure-as-code) · [Render Free service behavior](https://render.com/docs/free)

Enter the private values below in Render’s dashboard.

| Render variable | Value |
| --- | --- |
| `MONGODB_URI` | Your working Atlas connection string from `server/.env`. Reuse the same database name to retain your catalogue and seeded admin. |
| `CLOUDINARY_CLOUD_NAME` | Cloud name for your existing Cloudinary product environment. |
| `CLOUDINARY_API_KEY` | API key for that environment. |
| `CLOUDINARY_API_SECRET` | Matching API secret. |
| `CLIENT_ORIGIN` | The exact production Vercel origin, such as `https://your-project.vercel.app`. Use the planned name for the first Render deploy and correct it if Vercel assigns a different one. |
| `SITE_URL` | The same public origin, used for the sitemap and robots file. |

Render generates `JWT_SECRET`. The admin password and email you seeded are already represented by the admin record in Atlas. Reuse them to sign in. You only need the seed command if you use a different database without that admin record. Tracking defaults to off. Set `ENQUIRY_TRACKING_ENABLED=true` in Render if you want click counts.

Once the service exists, copy its outbound CIDR ranges from **Connect → Outbound**. In Atlas, add the ranges to the project’s **IP Access List**, then retry the Render deploy if the initial connection failed. Keep your current IP entry if you still develop locally. Open the Render service’s `/api/ready` URL and confirm the status is `ready`. [Render outbound IPs](https://render.com/docs/outbound-ip-addresses) · [Atlas connection on Render](https://render.com/docs/connect-to-mongodb-atlas)

## 3. Deploy the storefront to Vercel

Import the same GitHub repository into Vercel. Vercel requires a commercial plan for a live store. **Pro** supports this use. Review the plan before purchasing. Leave **Root Directory** at the repository root, select **Node.js 22.x**, and use the build settings in [vercel.json](vercel.json). Set these two variables for the **Production** environment and deploy. [Vercel plan rules](https://vercel.com/docs/plans/hobby) · [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) · [Vercel environment variables](https://vercel.com/docs/environment-variables)

| Vercel variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Your actual Render origin followed by `/api`, such as `https://your-api.onrender.com/api`. |
| `VITE_SITE_URL` | The exact public Vercel origin, such as `https://your-project.vercel.app`. |

Vercel only needs public URLs. Keep MongoDB, JWT and Cloudinary secrets in Render. The storefront expects the exact production origin in Render’s `CLIENT_ORIGIN`. If the actual Vercel hostname differs from your planned one, update both Vercel’s `VITE_SITE_URL` and Render’s `CLIENT_ORIGIN` and `SITE_URL`, then redeploy both. Use an origin without a path.

The function in [api/storefront.mjs](api/storefront.mjs) serves the app shell with the right title and share image for direct product links. It preserves HTTP 404 for unavailable pages, generates robots.txt on Vercel and forwards the sitemap from Render. The browser uploads directly to Render, so Vercel’s function request-size limit does not affect image uploads.

## 4. Verify the public site

Run the read-only verification from the project root. Enter the two origins without trailing paths when prompted:

```powershell
$renderSite = Read-Host 'Render HTTPS origin'
$vercelSite = Read-Host 'Vercel HTTPS origin'
node scripts/verifyDeployment.mjs $renderSite $vercelSite
```

- In a private browser window, open the Vercel URL followed by `/admin/login` and sign in.
- Create or update a draft and upload a small image. Confirm the draft stays private, then publish it when ready.
- On a phone, verify that an order button opens the intended WhatsApp chat with the product details and the public product link. You can close the draft without sending it.
- Open a published product link directly. Verify the image, sharing metadata, and that `/sitemap.xml` uses the public domain. Recheck after changing domains.
- Keep proxy trust at zero until confirming the deployed reverse-proxy path. Then set `TRUST_PROXY_HOPS` to the verified number of trusted hops so rate limits use the intended client address. [Express proxy settings](https://expressjs.com/en/guide/behind-proxies/)
- Run the [Phase 8 checklist](PHASE8.md) against the public HTTPS site.

## Source map

- [Render Blueprint](render.yaml)
- [Vercel routing and build](vercel.json) and [storefront metadata function](api/storefront.mjs)
- [Readiness route](server/routes/healthRoutes.js) and [server startup and shutdown](server/server.js)
- [Read-only deployment verifier](scripts/verifyDeployment.mjs)

## Interview angle

1. **Why does Render use a readiness check?** It returns HTTP 503 while MongoDB is disconnected. Render can avoid routing traffic to an API that cannot serve the catalogue.
2. **Why put only URLs in the Vercel environment?** The frontend needs to know where to contact the API. MongoDB, signing, and image-management credentials are only needed by the backend.
3. **Why add server-generated tags when React already sets them?** Link preview services can read the initial HTML without waiting for browser JavaScript. The Vercel function generates those tags from the published product data.
