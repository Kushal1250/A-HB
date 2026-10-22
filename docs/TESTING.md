# Verification record

## Passed in this implementation environment

- Production React/Vite build.
- 11 backend unit/security tests: scrypt salt/password verification, default/invalid schema validation, compare-and-swap draft isolation, stale-write conflicts, missing media rejection, public snapshot serialization, spoofed file rejection, image re-encoding/resizing with mocked Cloudinary uploads, failed persistence cleanup, protected endpoints, CORS rejection and JSON limits.
- 9 React/jsdom tests: invitation and quiet default, gift/candles/relighting/wishes/letter/final/replay, gallery navigation/cancel/focus restoration, reduced-motion particle suppression, image error placeholders, explicit audio controls using mocked browser audio, keepsake failure handling, API-offline fallback and preservation of unsaved admin edits after save failure.
- Node syntax checks for backend entrypoints and scripts.

The unit suite uses controlled substitutes for MongoDB model calls and Cloudinary delivery. It verifies application rules, not a real Atlas or Cloudinary account.

## Database integration suite included, not passed here

`server/tests/api.test.js` contains 14 real-database API tests: readiness, public retrieval, authentication boundaries, login/hash/expiry, draft isolation, publication, stale revisions, validation, file limits/signatures, memory lifecycle, seed idempotence, CORS and logout.

The temporary MongoDB binary was available, but its process exited during startup with `open: Operation not permitted` in this environment. The suite could not proceed. No real Atlas database credentials were supplied, and successful database integration is **not** claimed.

Run from the project root on a machine that can run a temporary MongoDB process:

```powershell
npm run test:integration
```

The package downloads/caches a MongoDB binary on first use. If local process restrictions prevent that, use a **dedicated disposable database**, never production. Its name must start with `birthday_test_`. The integration suite erases that database:

```powershell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/birthday_test_local"
npm run test:integration
Remove-Item Env:TEST_MONGODB_URI
```

For Atlas, use a separate restricted test database/user and set its URI privately in the shell; do not paste it into shared transcripts. The test's safety guard requires the `birthday_test_` database name.

## Checks still required with actual accounts/devices

- Atlas connectivity and the full integration suite.
- Real administrator creation/sign-in against that database.
- Real Cloudinary upload, short-lived download, audio streaming and deletion.
- Vercel-to-Render production requests and CORS.
- Browser layout at 320, 375, 390, 768, 1024 and 1440 pixels; horizontal overflow and real touch targets.
- Real keyboard traversal, native dialog focus trapping, Escape and screen-reader announcements.
- Real PNG export layout/download and audio playback.

No browser-control skill was available in this session, so manual browser/viewport verification was not performed. jsdom interaction tests are not a substitute for visual QA. The CSS contains responsive breakpoints and reduced-motion overrides, but these have not been visually certified.

## Reproduce completed checks

From the project root:

```powershell
npm run install:all
npm test
npm run build
```

Do not interpret a successful build as proof that production services are configured. A successful frontend preview does not prove that a separate Express backend is deployed.
