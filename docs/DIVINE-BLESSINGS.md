# The blessings courtyard (legacy presentation)

The keyed edition replaces the default thumbnail gallery with sequential one-image reveals. For the current default experience, use [the keys edition guide](KEYS-TO-YOUR-NEW-YEAR.md). This page documents the retained legacy layout.

This edition adds a separate devotional chapter to The Garden of October for Anu's birthday on 24 October 2026. It uses the supplied photographs and short video locally.

## Start on Windows

1. Extract the ZIP into a **new folder**, not over a running installation.
2. Install a compatible Node.js 24 LTS version, 24.15.0 or newer in that major release. The existing launcher checks compatibility.
3. Open the inner `anu-birthday-mern` folder containing `package.json`.
4. Double-click `START-LOCAL.cmd`. The first run installs dependencies, builds the frontend, and opens the local page.
5. Alternatively, open CMD in that folder and run:

```cmd
npm run install:all
npm start
```

Open `http://localhost:3000`. Keep the terminal open. Ctrl+C stops the server. Internet is needed for initial dependency installation; the installed experience uses local assets.

The uploaded archive contained Windows dependencies. They are intentionally excluded from this ZIP so installation chooses the correct platform packages. Lockfiles are included. No database installation, cloud account, external image URL, or API key is required.

## Use the chapter

Unlock the greenhouse, then choose “Begin with a little blessing” or “The blessings” in the chapter navigation. Open the courtyard, or continue directly into the birthday garden.

Browse 13 unique supplied photographs using thumbnails, Previous/Next, or horizontal touch swipes. “Full view” shows the complete photograph; arrow keys change views and Escape closes the native dialog. Photographs use `object-fit: contain` without colour filters. The decorative arch surrounds a rectangular image viewport so the image corners are not clipped.

The symbolic lamp, up to eight decorative flowers, six birthday wishes, and a gratitude reflection are optional. They have no scores and do not gate the birthday content. Replay of the whole garden resets them. Turning motion off opens the courtyard directly and disables decorative animation. Daylight and moonlight use the existing theme variables.

The supplied MP4 is approximately 6.73 seconds, H.264 video with AAC audio. It loads on demand and has native controls. Playing it pauses the birthday music; playing the music pauses the video. Music does not resume automatically. Continue from the chapter pauses the video. No transcript is invented; the supplied soundtrack is retained as-is.

## Edit in the studio

Open `http://localhost:3000/admin` and use your existing local account. There is no new default password.

If no account exists, stop the server, run `npm run admin:create`, enter an email and a password of at least 12 characters, and restart with `npm start`.

The **Divine Blessings** panel controls:

- Chapter visibility, heading, introduction, main prayer, and closing message.
- Featured image, image titles, captions, descriptions, order, and visibility.
- Symbolic lamp, flower offering, blessing choices, and gratitude reflection.
- Devotional image and MP4 upload, video selection, title, and description.

Use `{name}`, `{shortName}`, and `{sender}` in the chapter's messages. Six short selectable wishes and the symbolic gesture wording are defined in `shared/blessings.js`; the studio toggles those interactions. Individual wish wording is edited in that source file.

Upload devotional pictures through this panel so they do not enter the personal memory gallery. Images support JPEG/PNG/WebP up to 8 MB and 40 million input pixels. Video supports MP4 up to 15 MB. Browser codec support still determines playback of newly uploaded videos; the supplied clip uses common H.264/AAC codecs.

Choose **Save draft → Preview saved draft → Publish saved draft**. Publication changes only the local visitor page.

Removing a devotional image from the draft does not delete its file. The existing uploaded-files list allows deletion after it is absent from **both** saved draft and published content. Hidden and disabled references still protect files from deletion. Hidden devotional images are not publicly served unless also used by another visible published section.

## Keep newer local work

If you have changed the project on your PC since uploading:

1. Stop the old server.
2. Back up its entire `data` folder somewhere safe.
3. Extract this ZIP into a separate folder.
4. Replace the new folder's entire `data` folder with your newer backed-up `data` folder. Do not combine individual JSON files.
5. Start the new version.

At startup, snapshots without a `blessings` property receive the new chapter. Existing content fields, accounts, hashes, sessions, media, and music stay intact. A copy of the original JSON is saved as `data/birthday.before-blessings.json` before the migration. The revision increases once. Bundled devotional display assets are copied into `data/uploads` only if missing. Subsequent startups do not reset edited or disabled chapters and do not duplicate media records.

The migration adds the new chapter to both older snapshots. It does not publish your unrelated unsaved draft text. The delivered `data/birthday.json` is retained from the uploaded project; this migration runs when you first start the new version.

To undo the migration on an older copy, stop the server and restore the complete pre-update `data` backup into the old project. Restoring only the JSON into this new version will intentionally trigger the migration again.

## Source media

`shared/assets/blessings/originals` contains untouched originals, one per unique image and one original video. Exact duplicate uploads share one preserved original. `source-map.json` records every supplied filename and the corresponding original/display asset. No unique supplied photograph is omitted.

`manifest.json` registers the 13 photographs and one video with stable media IDs. Display WebP images have a maximum 1800-pixel edge, with small thumbnails. The originals are not served to visitors. The featured photograph and gallery are separate from personal memories. Neutral editable titles describe visible features without inventing a temple, location, or uncertain deity identity.

The active local backend is `server/src/app.js` with `store.js` and the new `blessings.js`. Older cloud-related source files in the archive remain unused by this local edition. No cloud functionality was introduced.

## Validation and remaining verification

Run `npm test` for local API/storage and React interaction tests, and `npm run build` for the production bundle. New tests cover backups and migration idempotence, content preservation, strict schemas, image visibility, signed previews, publication, media deletion safeguards, MP4 upload and range delivery, gallery navigation, modal keyboard control and focus restoration, bounded flowers, blessing choices, media errors, admin edits, and music/video coordination.

Automated checks run in Linux with Node 24.19.0. Real-browser visual QA at phone, tablet, and desktop sizes was not available in this environment. Responsive CSS is included, but native video playback, actual screen-reader behaviour, and final visual layout should be reviewed in a browser on the target computer. Tests do not substitute for that review. The Windows launcher was inspected, not executed on Windows.
