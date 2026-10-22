# Deploy: React on Vercel + Express on Render

This project stores its content in local files (`data/birthday.json` and
`data/uploads/`). It does **not** use MongoDB or Cloudinary.

```
Browser ──► Vercel (React site, static files)
               │  /api/*  is proxied by the rewrite in vercel.json
               ▼
            Render (Express API + your photos / videos / music)
```

The browser only ever talks to the Vercel address, so there is no CORS to
configure. Vercel forwards `/api/*` to Render, and Render checks that
state-changing requests come from the Vercel origin listed in
`FRONTEND_ORIGINS`.

## 0. Why `seed-data/` exists

`data/` is in `.gitignore` (it holds password hashes and private media), so a
fresh Render checkout has no content. `npm run deploy:seed` builds a clean
`seed-data/` folder from your local `data/`:

- keeps `birthday.json`, `garden-entrance.png` and only the uploads your content really uses
- leaves out backups, `*.before-*.json`, half-finished uploads and unused media
- **removes administrator accounts and sessions** (the admin is created from environment variables instead)

On first start the server copies `seed-data/` into its data directory.

> Make the GitHub repository **private**: it contains personal photos, videos and letters.

## 1. Prepare and push

```powershell
cd path\to\your\project          # the folder that contains client, server, shared, data
npm run deploy:seed              # creates seed-data/
git status                       # data/ must NOT be listed; seed-data/ should be
git add .
git commit -m "Deployment fixes and seed data"
git push origin main
```

If the push fails with `HTTP 408` / `RPC failed`, run
`git config http.postBuffer 524288000` and push again.

## 2. Render (backend)

1. https://dashboard.render.com → **New +** → **Blueprint** → connect the GitHub repo → pick `render.yaml`.
2. Enter the three prompted values:
   - `FRONTEND_ORIGINS` = `https://YOUR-VERCEL-NAME.vercel.app` (exact origin: no trailing `/`, no `/admin`; a placeholder is fine for now)
   - `ADMIN_EMAIL` = the email you will use to sign in at `/admin`
   - `ADMIN_PASSWORD` = 12–256 characters
3. **Apply**. When the deploy is live, copy the service URL from the top of the page.
4. Open `https://YOUR-RENDER-URL/api/health`. Expect `{"status":"ok","storage":"local","port":3000}`.
   The first request after idle can take about a minute on the free plan.

Render logs should show `First start: copied seed-data/ into the data directory.`
and `Administrator account: created.`

## 3. Vercel (frontend)

1. If your Render URL is not exactly `https://anu-birthday-api.onrender.com`, edit the `destination` line in `vercel.json`, commit and push.
2. https://vercel.com/new → import the repo.
3. Project name: choose the name used in `FRONTEND_ORIGINS` (e.g. `anu-birthday`).
4. Root Directory: leave as the repository root (`./`). Build settings come from `vercel.json`. No environment variables are needed.
5. **Deploy**.

## 4. Connect them

Render → your service → **Environment** → set `FRONTEND_ORIGINS` to the exact Vercel origin → **Save** (Render restarts).

## 5. Verify

- `https://YOUR-SITE.vercel.app` shows the birthday experience with photos and videos.
- `https://YOUR-SITE.vercel.app/api/health` returns the same JSON as Render (proves the proxy works).
- `https://YOUR-SITE.vercel.app/admin` → sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Refreshing `/admin` does not 404.

## Environment variables (Render)

| Variable | Needed | Meaning |
| --- | --- | --- |
| `NODE_ENV` | yes (`production`, set in `render.yaml`) | Enables the Vercel-origin check |
| `FRONTEND_ORIGINS` | yes | Comma-separated exact Vercel origins |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | to use `/admin` | Created/updated on every start; change the password by changing the variable |
| `DATA_DIR` | only with a paid disk | e.g. `/var/data` |
| `PORT` | set by Render | |

## Free plan limits (read this)

- Render free web services spin down after 15 idle minutes and **lose all local file changes** when they restart or redeploy. Your published site always comes back from `seed-data/`, but **edits made in the production `/admin` are temporary**.
- Recommended workflow on the free plan: edit locally (`npm start`), then `npm run deploy:seed`, commit, push. Render redeploys with the new content.
- To make production edits permanent, use a paid Render instance with a persistent disk: set `plan` to a paid type, uncomment the `disk:` block in `render.yaml`, and add `DATA_DIR=/var/data`. The seed is copied onto the disk only once.
- Uploading large videos through the production `/admin` (Vercel proxy) may fail; upload locally instead.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Site loads but no photos / "fallback" notice | Open `/api/health` on the Vercel URL. If it fails, fix the `destination` in `vercel.json` |
| `502` / `ROUTER_EXTERNAL_TARGET_ERROR` right after a long idle | Render is waking up; retry in a minute |
| Login says "Requests from this website are not allowed" | `FRONTEND_ORIGINS` does not exactly match the Vercel origin; fix and let Render restart |
| Login says "Create your local administrator first" | `ADMIN_EMAIL` / `ADMIN_PASSWORD` not set on Render |
| Render deploy fails at start | Render → Logs; most often a typo in `ADMIN_EMAIL` or a password shorter than 12 characters |
| `/admin` refresh gives 404 | Vercel Root Directory must be the repository root so `vercel.json` is used |
