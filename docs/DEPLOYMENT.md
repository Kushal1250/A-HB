# Deploy React to Vercel and Express to Render

Keep the entire repository, including `shared/`. The recommended configuration uses the **repository root** on both hosts. Do not select `server` as the Render root: the backend imports shared defaults outside that folder. Do not remove `shared/defaults.json`.

Accounts and actual provider resources must be created in your own Vercel, Render, MongoDB Atlas and Cloudinary accounts. No production credentials have been supplied. Costs and plan behaviour depend on your selected providers/plans; review their dashboards before creating paid resources.

## 1. Prepare the repository

Create a private Git repository if desired. Upload the project source, both lockfiles, shared defaults and deployment configuration. The `.gitignore` excludes local environment files, dependencies and private media. Do not upload real `.env` files.

This source package excludes the internal ChatGPT Site configuration. Vercel and Render do not need it.

## 2. Create MongoDB Atlas

1. Create an Atlas project and database deployment suitable for your needs.
2. Under database access, create a database user for this application. This is different from your Atlas account login.
3. Give it `readWrite` on the application database `anu_birthday`, rather than access to unrelated databases.
4. Under network access, add your development computer's current IP address for setup.
5. Choose Connect → Drivers and copy the Node.js connection URI.
6. Include the database name, for example `mongodb+srv://USER:PASSWORD@YOUR_CLUSTER/anu_birthday?retryWrites=true&w=majority`.
7. Percent-encode special characters **inside the username/password**, not the complete URI. For example `@` in a password becomes `%40`. Use a trusted local URI encoder; do not paste credentials into a random website.
8. Put the resulting URI in `server/.env` as `MONGODB_URI` for local setup.
9. From the project root run `npm run seed`, followed by `npm run admin:create`.
10. Add Render's outbound IP ranges to the Atlas access list after creating the Render service. Render's service dashboard displays those ranges; add all applicable ranges so restarts do not break connectivity.

Avoid using `0.0.0.0/0` as a permanent shortcut. It allows connection attempts from anywhere, although database authentication still applies. Prefer the documented Render outbound ranges plus your current development IP; consider dedicated egress/private networking where your provider plan supports it. Remove temporary development IP entries when no longer needed.

Never put the URI into Vercel or any `VITE_` variable. Use a separate disposable database for tests.

## 3. Create Cloudinary media configuration

1. Create a Cloudinary product environment.
2. Find its cloud name, API key and API secret in the account's API configuration.
3. Put those values only in backend configuration:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Do not create an unsigned public upload preset for this app. Uploads go through the authenticated Express endpoint.
5. Assets are uploaded with delivery type `authenticated`. The backend creates separate image thumbnails and generates short-lived private-download links.
6. Verify a real upload, thumbnail, audio playback and deletion after deploying. Provider settings or account restrictions can affect delivery; inspect the backend logs and Cloudinary dashboard if a real request fails.

The source never contains image/audio bytes. Full integration with a real Cloudinary account still needs verification using your credentials.

## 4. Deploy the backend on Render

Create a **Web Service**, connect your source repository and use:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | Repository root: leave blank / `.` |
| Build command | `npm ci --prefix server` |
| Start command | `npm start --prefix server` |
| Health check | `/api/health` |
| Node version | 24.19.0 (or compatible Node 24 runtime) |

Alternatively import the supplied `render.yaml` Blueprint and review the proposed service and plan before creation.

Set backend environment variables:

```dotenv
NODE_ENV=production
TRUST_PROXY=1
MONGODB_URI=your-secret-atlas-uri
FRONTEND_ORIGINS=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

Use an intended Vercel origin initially; update it when you know the actual deployed hostname. `FRONTEND_ORIGINS` contains **origins**, without `/admin`, `/api`, other paths, or trailing slashes. Multiple exact origins can be separated by commas. Do not use `*`. Preview deployments require adding their exact approved origins intentionally; a blanket `*.vercel.app` allowlist is not used.

Render supplies `PORT`. The app reads it and binds to `0.0.0.0`. It connects to MongoDB before listening. Copy the actual Render URL from its dashboard; never use a guessed hostname.

After adding Render's egress ranges to Atlas, deploy and open:

```text
https://YOUR-ACTUAL-RENDER-HOST/api/health
```

Expect `{"status":"ok"}`. This route checks MongoDB connection readiness. If startup fails, check Atlas credentials, IP access entries, URI encoding and DNS. No need to expose your secrets when asking for help.

If you already ran seed/admin setup locally against the **same Atlas database**, those records are ready. Otherwise run the setup commands locally against that database, or from an interactive Render shell if your service supports one. Setup commands are **not** placed in the web start command, and no hardcoded administrator password is created.

## 5. Deploy the frontend on Vercel

Import the same repository.

Use these settings, matching the root `vercel.json`:

| Setting | Value |
| --- | --- |
| Root directory | Repository root: `.` |
| Framework | Vite |
| Install command | `npm ci --prefix client` |
| Build command | `npm run build --prefix client` |
| Output directory | `client/dist` |
| Node runtime | Compatible Node 24 |

Set this **public build-time** variable:

```dotenv
VITE_API_BASE_URL=https://YOUR-ACTUAL-RENDER-HOST
```

Do not append `/api`; the application adds it. Set the variable for the relevant production/preview environments. Changing it requires a new frontend build/deployment. Never put database passwords, administrator passwords or the Cloudinary secret into Vercel frontend variables.

The root `vercel.json` provides SPA rewrites so direct `/admin` visits and refreshes return the React entry point. Static `/assets/` requests are not rewritten to HTML. The file also adds noindex and basic response headers.

If selecting `client` as the Vercel root instead, use `npm ci`, `npm run build`, output `dist`, the supplied `client/vercel.json`, and enable inclusion of files outside the root so `shared/defaults.json` is available. The repository-root configuration is simpler and recommended for this package.

## 6. Connect and verify production

1. Copy the actual Vercel production origin into Render's `FRONTEND_ORIGINS`.
2. Restart/redeploy Render after changing its environment.
3. Verify Vercel's `VITE_API_BASE_URL` is the actual Render origin and redeploy the frontend after any change.
4. Open the Vercel birthday page.
5. Open `/admin`, sign in, change a harmless draft field and save.
6. Confirm the public page still shows its previous publication.
7. Preview the draft, then publish it.
8. Confirm the public page now shows the published change.
9. Upload a photo with a truthful description, save, preview and publish; verify thumbnail and full photo.
10. Upload permitted audio and verify play/pause/mute after an explicit click.
11. Verify media removal requires detaching from both saved snapshots.
12. Test on a real phone and with reduced motion.

Anyone can view the published Vercel birthday and API unless you deliberately configure access restrictions. Only administrators can change it. The old ChatGPT-hosted frontend preview remains separately private; that preview is not the Render backend.

## Troubleshooting

| Symptom | What to inspect |
| --- | --- |
| Render never becomes healthy | Startup logs; MongoDB URI, credentials, DNS and Atlas network access |
| Health URL works but browser says CORS | Exact Vercel origin in `FRONTEND_ORIGINS`; redeploy Render |
| Birthday works but shows fallback notice | API base URL, API logs, connectivity and seed data |
| `/admin` refresh returns 404 | Correct Vercel root config and SPA rewrite |
| Editor says backend is not configured | Vercel build-time `VITE_API_BASE_URL`; rebuild |
| Login works but refresh signs out | Expected: bearer token is memory-only; sign in again |
| Uploads unavailable | Cloudinary backend environment variables |
| File rejected despite extension | Content signature, actual file type, size or decoded pixel limit |
| Stale draft conflict | Copy unsaved text, reload latest draft, merge intentionally and save |
| Media link expired in old admin screen | Refresh files & preview links; reopen saved preview |

## Official references checked for these instructions

- Vite on Vercel: https://vercel.com/docs/frameworks/frontend/vite
- Vercel rewrites: https://vercel.com/docs/routing/rewrites
- Express on Render: https://render.com/docs/deploy-node-express-app
- Render outbound addresses: https://render.com/docs/outbound-ip-addresses
- MongoDB Atlas connections: https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- Cloudinary upload API: https://cloudinary.com/documentation/image_upload_api_reference
- Cloudinary access control: https://cloudinary.com/documentation/control_access_to_media

Provider interfaces and plan features can change. Use the actual dashboard values for your resources. No Vercel, Render, Atlas or Cloudinary production resources were created in this implementation session.
