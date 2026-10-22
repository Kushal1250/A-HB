# Architecture and configuration

## Request flow

React fetches `GET /api/birthday` from the configured Express backend. Express selects only the `published` snapshot from the singleton MongoDB birthday document and resolves its media references. The frontend renders bundled defaults immediately; an unavailable API leaves the story usable with a short status notice. It refreshes content every eight minutes to renew ten-minute media URLs.

An administrator signs in with an email and scrypt-hashed password. The backend creates a cryptographically random 256-bit bearer token and stores only its SHA-256 hash in a MongoDB session document. Sessions expire after two hours; every protected request checks expiration independently of MongoDB's asynchronous TTL cleanup. Logout deletes the session. The frontend stores the raw token **only in React memory**, so refresh requires signing in again. No cookies or automatic browser credentials are used, so the API is not dependent on cross-site cookies and cookie-based CSRF protections are not needed. Never move tokens to localStorage without reconsidering the design.

Drafts and published content are separate snapshots. A revision number protects saves and publishes against stale writes. Draft preview is authenticated. Publishing uses the exact saved revision; form fields with unsaved changes cannot be published accidentally. A failed save preserves the form. Session expiry hides editing behind sign-in without clearing unsaved data. Page unload warns about unsaved edits.

Photos/audio are uploaded through authenticated Express routes using memory buffers, not durable local disk. Files are identified by their signatures, not their filename. JPEG, PNG and WebP images are limited to 8 MB and 40 million decoded pixels; they are rotated, resized, and converted by sharp without retaining source EXIF. Audio supports MP3/WAV, limited to 15 MB. Image originals and separate thumbnails use Cloudinary's authenticated delivery type. The API produces ten-minute private-download links only for the selected published snapshot or authenticated admin results.

The public birthday is intentionally viewable without login. Anyone viewing it can download the published photos/audio while their URLs are valid. Draft-only assets are not included in the public API. Signed download URLs can be shared during their validity and media already downloaded cannot be recalled. This is different from making the entire birthday private.

## Source layout

- `client/src/Birthday.jsx`: public experience, cake, stars, gallery, letter, music, canvas keepsake.
- `client/src/Admin.jsx`: authenticated editor and draft workflows.
- `client/src/PublicPage.jsx`: defaults, API fetching, status and metadata.
- `client/src/Modal.jsx`: native dialog, Escape, focus restoration, backdrop.
- `client/src/api.js`: API transport and upload progress.
- `client/src/styles.css`: responsive design and reduced motion.
- `shared/defaults.json`: initial English birthday content, theme and optional sections.
- `server/src/app.js`: HTTP security, CORS, JSON limits and error responses.
- `server/src/routes/api.js`: public, authentication, draft, memory, media and publish routes.
- `server/src/models.js`: MongoDB models and connection readiness.
- `server/src/services/`: password hashing, snapshot rules, media processing.
- `server/scripts/`: seed, administrator setup and cleanup.
- `client/vercel.json`: alternative Vercel configuration if client is selected as root with outside files included.
- `vercel.json`: recommended repository-root Vercel configuration.
- `render.yaml`: Render blueprint; repository root retained so shared defaults are available.

## Environment variables

| Variable | Location | Secret? | Meaning |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `client/.env` / Vercel | No | Express origin, e.g. `https://your-api.onrender.com`, without `/api` |
| `MONGODB_URI` | `server/.env` / Render | Yes | MongoDB Atlas URI including database name |
| `FRONTEND_ORIGINS` | Backend | No | Comma-separated exact allowed origins, no trailing slash |
| `PORT` | Backend | No | Local 5000; Render supplies its own port |
| `NODE_ENV` | Backend | No | `production` on Render |
| `TRUST_PROXY` | Backend | No | `0` direct local; `1` for the expected Render reverse-proxy layout |
| `CLOUDINARY_CLOUD_NAME` | Backend | Configuration | Media account identifier |
| `CLOUDINARY_API_KEY` | Backend | Keep on backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Yes | Cloudinary signing/upload secret |
| `TEST_MONGODB_URI` | Integration test process only | Yes if credentials | Disposable test database; the integration suite deletes its contents |

All `VITE_` values are embedded in browser assets. Never put secrets there. Environment examples contain no real credentials. Passwords are entered interactively, not through the frontend or command arguments.

## Data schema

Birthday document: `_id = birthday`, `draft`, `published`, `revision`, `publishedAt`, timestamps.

Each content snapshot contains `name`, `shortName`, `sender`, optional `birthday` (`YYYY-MM-DD`), IANA `timezone`, `headline`, `intro`, `letter`, `finalMessage`, `colors`, `sections`, `noIndex`, ordered `photos`, and nullable `musicId`. A photo has UUID `id`, MongoDB `mediaId`, `caption`, required `alt`, and optional `date`. Public serialization adds `src`, `thumbnail` and resolved `music`; do not send those derived fields back as draft input.

Birthday date is a calendar date, displayed without converting it into another day. Timezone is validated and stored for future scheduling. There is no countdown, inferred age, visitor tracking, wish storage or microphone recording.

Admin stores unique normalized email and password hash. Session stores hashed token, admin reference and expiry. Media stores provider IDs, resource type, format, safe original filename, byte count and timestamps.

## API reference

All endpoints start with `/api`. Errors have `{ "error": { "message": "...", "fields": [] } }`.

| Method/path | Access | Behaviour |
| --- | --- | --- |
| GET `/health` | Public | 200 only when MongoDB is connected |
| GET `/birthday` | Public | Published snapshot and delivery URLs |
| POST `/auth/login` | Public, rate limited | Email/password -> in-memory bearer session |
| POST `/auth/logout` | Admin | Revoke current session |
| GET `/admin/draft` | Admin | Raw editable content, revision, media readiness |
| PUT `/admin/draft` | Admin | `{revision, content}`; validate and save |
| GET `/admin/preview` | Admin | Resolved saved draft |
| POST `/admin/publish` | Admin | `{revision}`; publish saved snapshot |
| POST `/admin/memories` | Admin | `{revision, photo}`; add to draft |
| PATCH `/admin/memories/:id` | Admin | `{revision, photo}`; replace memory |
| DELETE `/admin/memories/:id` | Admin | `{revision}`; detach from draft |
| POST `/admin/memories/reorder` | Admin | `{revision, ids}`; every UUID exactly once |
| GET `/admin/media` | Admin | Provider links and saved-reference usage |
| POST `/admin/media` | Admin, rate limited | Multipart `file`, no other fields |
| DELETE `/admin/media/:id` | Admin | Delete only if absent from draft and publication |

401 requires sign-in, 409 indicates revision/reference conflict, 422 indicates invalid content, 413 indicates request/file limits, 415 indicates unsupported file content, and 503 indicates unavailable configuration/service.

The API sends no-store for birthday content, authentication responses and admin responses; provider storage controls media caching. Hashed frontend assets can be cached by the frontend host. Application logs never intentionally include passwords, bearer tokens or MongoDB URLs.

## Operational boundaries

Designed for a small single-instance personal birthday API. Rate limits use process memory, so multiple replicas need a shared rate-limit store. Pause administrator editing during destructive media cleanup; deletion checks references but is not a multi-document transaction against simultaneous edits. Use database backups before operational changes. The cleanup script is dry-run by default.
