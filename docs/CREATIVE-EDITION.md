# Nine Keys, One Beautiful Year — creative edition

This is the upgraded version of the user's uploaded `anu-birthday-mern(4).zip`. It retains local operation at **http://localhost:3000** and the studio at **http://localhost:3000/admin**.

## Run on Windows

1. Extract the ZIP into a **new folder**.
2. Use a compatible Node.js 24 LTS release, version 24.15.0 or newer in that major version.
3. Open the inner `anu-birthday-mern` folder containing `package.json` and `START-LOCAL.cmd`.
4. Double-click **START-LOCAL.cmd**. First-run installation needs internet; installed media play locally.
5. Keep the terminal open. Open http://localhost:3000 if it does not open automatically. Ctrl+C stops the server.

Alternative CMD commands, from that inner folder:

```cmd
npm run install:all
npm start
```

No MongoDB, cloud account, paid API, or additional browser permission is required. The installer selects platform-appropriate dependencies; node_modules and build caches are intentionally excluded. `npm test` now builds production assets before running the test suites.

## Shirt-inspired palette

The supplied shirt photograph was used only as a colour reference; the personal photograph was not inserted into the website. Representative shirt samples were RGB (102,72,54), (88,60,43), and (84,61,48). The chosen coherent brown is **#6B5141**, close to the prompt's reference estimate.

| Role | Default | Toggled |
|---|---|---|
| Page identity/background | Cocoa brown #6B5141 | Dark green #153D2C |
| Main typography | Dark green #153D2C | Brown #49372C |
| Reading surfaces | Warm cream #F3E8D5 | Pale cream/green #F0E9D6 |
| Primary buttons | Dark green with cream text | Brown with cream text |

Dark body text sits on light panels for contrast. It is not placed directly on a similarly dark page background. Panels, navigation, forms, dialogs, keyring and keepsake text participate in the reversal. God photographs retain their original colours. Main reading pairs are checked for WCAG AA contrast in automated tests; broader visual review is still required.

## Different chapters, different opening mechanisms

| Chapter | Default opening | Accessible alternative |
|---|---|---|
| Invitation | Scratch a decorative wax-paper covering | Reveal directly |
| Garden gate | Choose and turn the gate key | Open directly |
| Divine blessings | Open individual devotional doors | Open directly; quiet mode |
| Wishes | Move a water drop to its seed using a range control | Water the seed |
| Lanterns | Move the illustrated lantern left/right | Arrow keys or Gently shake the lantern |
| Memories | Slide the cabinet open, then place three leaves | Open the cabinet directly |
| Celebration | Pull the ribbon using a range control | Untie the ribbon |
| Letter | Trace along the dotted envelope seam | Open the envelope directly |
| Keepsake | Move the key into its frame using a range control | Place the key |

Scratch uses a 24×10 occupancy grid to estimate cleared coverage. It does not read canvas pixels on each move. Canvas resolution respects device pixel ratio, the brush works with pointer/touch input, and only the scratch surface captures touch scrolling. Resize observers and animation frames are cleaned up. The default reveal threshold is 40%, editable from 20% to 70%. Essential content remains HTML and direct reveal remains available if canvas is unavailable.

Lantern movement is simulated, never physical device shaking. Three deliberate direction changes complete it. Movement stays within ±35 pixels. The default sensitivity is 14 pixels, editable within safe bounds. No motion-sensor permission is requested. Pending completion timers are cancelled on unmount.

Trace follows a horizontal dotted seam. Cabinet, water, ribbon and placement controls use native range inputs for touch and keyboard operation. Every chapter retains an Open directly action, chapter navigation, replay and open-all access. Quiet reading opens chapters without requiring gestures.

## Devotional journey

Only one devotional photograph is prominent at a time. There is no thumbnail wall. The current picture is loaded on reveal, and full view shows that same complete image using contain sizing.

Thirteen styles are supported and assigned to the stock sequence: curtains, frame tracing, doors, a flower motif, lamp light, a page, an arch, a ribbon, a hanging frame ornament, a folding paper window, a garland, an envelope, and a final prayer card. The image itself is never warped, recoloured, spun or fragmented. Garland and flower decoration stay around the frame instead of covering faces.

The symbolic lamp, bounded flowers, prayer envelope, selected blessing, gratitude reflection, optional video alcove, previously revealed text list and final prayer remain available. Ritual actions are optional and do not award points. Quiet/reduced-motion presentation omits decorative coverings and shows the current photograph directly.

Each image's title, caption, description, theme, blessing and reveal style can be edited in the studio. The source contains 13 unique supplied photographs; exact duplicate source filenames still map to their preserved original through source-map.json.

## First music and discreet sound controls

A fresh page opens at the beginning and prepares sequence one's track, even when keys from an earlier visit are saved. Automatic audible playback is attempted if enabled and not prohibited by a previous pause/mute choice. The browser may block it.

**Open Anu's Garden** is the welcome action. Its deliberate click can start sound when autoplay was blocked. There is no prominent Play music button on arrival. A small **♫ Sound settings** button exposes pause/resume, mute, volume, current recording credits and Continue silently.

Explicit silence and mute are respected. They are not overridden just because the entrance is clicked. Resume soundtrack inside sound settings explicitly enables playback again.

**Continue where I left off** moves to the saved chapter and selects its soundtrack. Ordinary fresh opening starts at sequence one. Chapter visibility uses a 180 ms settle interval to avoid rapid track changes near boundaries. Backward navigation follows the corresponding track. One audio element prevents overlapping tracks; no crossfade is implemented.

Video playback pauses the soundtrack, and starting the soundtrack pauses an open video. Leaving the video chapter pauses its video. Background music does not unexpectedly restart after a video or after an explicit pause/mute.

### Music selection and rights

The nine local tracks are the original instrumentals from the previous edition. **No famous commercial recordings are bundled.** The prompt explicitly permits original alternatives when approved/licensed song recordings are unavailable, and none were attached with this request.

`shared/assets/journey/music-credits.json` lists chapter, title, composition source, file, duration, default volume and rights notes for the bundled originals. `manifest.json` registers their stable media IDs. The optional reproducible authoring script is `scripts/compose-journey.py`; startup does not require Python or ffmpeg.

Upload any supplied/appropriately licensed MP3 or WAV through the studio, then select it for a chapter. New per-chapter fields allow title, artist/composer, recording source, licence/rights notes, provenance and duration. Selecting a new recording resets its credits to that recording's information so stale titles do not remain. Published settings are the authoritative metadata for customised selections; the static credits file describes bundled originals.

## Birthday wishes and studio

The prompt's new central birthday wish is included separately from the longer letter, so customised letters are preserved. Edit it under **Central birthday wish** in the keys panel. Existing main letter, final wish, per-image prayers and photo captions remain editable.

The keys panel also edits chapter order/visibility, key names, labels, helper text, interaction type, scratch threshold, lantern sensitivity, autoplay attempt, default volume, motion intensity, and chapter recording/credits. The Divine Blessings panel edits thirteen reveal styles and its existing controls.

Use **Save draft → Preview saved draft → Publish saved draft**. Preview does not autoplay. New settings are validated and preserved through saving, previewing, publication and restart. Media referenced by draft or published content—including disabled/hidden chapters—remain protected from deletion.

Use your existing administrator account. If none exists, stop the server, run `npm run admin:create`, enter an email/password, then restart. No default password was introduced.

## Preserve newer local work

1. Stop the old server.
2. Back up its entire data folder.
3. Extract this ZIP to a separate folder.
4. If your PC has newer edits, replace the new installation's entire data folder with that newer backed-up folder before startup.
5. Start the new version.

The delivered birthday.json remains byte-for-byte the user's newly uploaded version. All its uploaded media and existing backups are retained. Startup creates **data/birthday.before-creative.json** before filling missing fields and upgrading known stock interactions/reveals. It preserves custom text, disabled chapters, accounts, hashes, sessions, media references and separate draft/published snapshots. The migration increases revision once and is repeatable without duplicate records or repeated resetting.

If even older data are supplied, earlier blessings/keys migrations run first with their own backups. Restore a complete pre-update data backup into the corresponding older project for rollback.

Browser progress remains separate and versioned. Keys, active chapter, revealed-photo IDs, chosen prepared blessing and sound preferences may be remembered locally. Private typed boat wishes stay only in page memory and are not uploaded or saved.

## Animation inventory and verification

See **ANIMATION-INVENTORY.md** for 79 named bounded sequences, actual targets and triggers. They are not 79 simultaneous loops. Offscreen/hidden-document animations pause; reduced-motion and quiet modes retain accessible final states. Flowers, sparkles, fireflies and particles are bounded.

See **VERIFICATION-CREATIVE.md** for final test results and limitations. Real-browser visual, responsive and listening review was unavailable in this environment. Audible autoplay can require a visitor click. Windows launcher execution and physical touch/screen-reader behaviour remain to be checked on the target computer.
