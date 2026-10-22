# The Keys to Your New Year

Anu's birthday garden now has nine keyed chapters, a brown/green palette toggle, sequential devotional photographs, and nine original chapter instrumentals. The existing local server, media library, accounts, editor, and Windows launcher are retained.

## Start on Windows

1. Extract this ZIP into a **new folder**.
2. Use a compatible Node.js 24 LTS version, 24.15.0 or newer within that major release. If Windows selects an older NVM installation, the existing launcher tries the compatible Program Files installation for its own window.
3. Open the inner `anu-birthday-mern` folder containing `package.json`.
4. Double-click `START-LOCAL.cmd`. It installs dependencies if needed, builds React, and starts the local server.
5. Alternatively, open CMD in that folder:

```cmd
npm run install:all
npm start
```

Open **http://localhost:3000**. The studio is **http://localhost:3000/admin**. Keep the terminal open; Ctrl+C stops it. Installation needs internet access. The installed experience uses local media and needs no MongoDB, cloud account, or API key.

There is no new default administrator password. Use the existing account. If no account exists, stop the server, run `npm run admin:create`, enter an email/password, and restart. The setup command requires a password of at least 12 characters.

## The journey

| Chapter | Key | Default interaction |
|---|---|---|
| The sealed invitation | Invitation Key | Select the key, then break the wax seal |
| The garden entrance | Garden Gate Key | Turn the garden key |
| The blessings courtyard | Blessing Key | Open the quiet courtyard |
| The growing wishes | Seed Key | Plant a seed with a little water |
| The lantern walk | Lantern Key | Light a lantern |
| The memory cabinet | Memory Key | Place three leaves, left to right |
| The birthday pavilion | Celebration Key | Untie the birthday gift |
| The personal letter | Letter Key | Unfold an envelope |
| The final keepsake | Keepsake Key | Place the final key |

The normal route offers the next key after the previous chapter is opened. Every chapter also has **Open directly — skip this interaction**. **Open all chapters** bypasses all locks. These are decorative interactions, not security or measures of devotion.

The chapter map supports revisiting any section. **Garden Keyring** shows collected keys. **Replay this chapter** resets its local scene and key without relocking other chapters. Replaying blessings also resets its revealed-photo progress. **Start the journey again** and **Reset saved progress** ask before resetting all browser progress. Neither changes administrator content or files.

## Brown and green

The keyed experience opens with a deep brown background and light cream text. **Switch to green** changes the complete palette to forest green; **Switch to brown** returns it. A visit starts brown by design rather than restoring a previous palette.

The former daylight/moonlight experience remains available if the administrator disables the keyed journey. Brown/green controls apply to the new keyed journey.

## One devotional photograph at a time

The courtyard shows one closed door and one short wish, not a thumbnail wall. **Reveal this blessing** opens a single complete photograph. **Continue to the next blessing** goes to a new door. The full-view dialog contains the same photograph, without crop or colour filters. Every photograph has editable theme, blessing, caption, alternative text, and reveal style.

Seven bounded reveal styles animate the surroundings: curtains, tracing light, doors, a flower motif, lamp light, a decorative page, and an arch outline. The deity image itself is not transformed. Revealed steps can be revisited through a compact text list. The original 13 unique photographs are retained, along with the original-file mapping from the prior edition.

Optional additions include a symbolic lamp, up to eight flowers at the frame base, a prayer envelope from Kushal, six selectable wishes, a gratitude reflection, the supplied video behind an optional alcove, and a final prayer. None is required to continue. The selected wish appears in the final chapter and downloaded keepsake.

**Quiet reading mode** opens all chapters, disables decorative motion, shows the current devotional photograph directly, and hides optional ritual controls. Previous/next controls still show only one photograph at a time. Reduced-motion mode likewise shows photograph states without waiting for a reveal animation.

## Nine original music tracks

| Chapter | Original instrumental | Approximate duration |
|---|---|---|
| Invitation | The Sealed Invitation | 17 seconds |
| Garden gate | Through the Garden Gate | 16 seconds |
| Blessings | Stillness in the Courtyard | 19 seconds |
| Wishes | Seeds of Courage | 15 seconds |
| Lanterns | The Lantern Walk | 18 seconds |
| Memories | Stories Yet to Happen | 16 seconds |
| Celebration | October Birthday Waltz | 14 seconds |
| Letter | Words Worth Keeping | 18 seconds |
| Keepsake | Something Still to Bloom | 17 seconds |

These are nine distinct original, synthesised instrumentals, not commercial songs or fetched recordings. Each loops locally. `scripts/compose-journey.py` is an optional reproducible authoring utility; normal startup does not need Python, NumPy, or ffmpeg. The existing October Light recording is also retained in the media library.

The soundtrack follows the chapter entering the viewport and also responds to chapter-map navigation. One audio element changes source; tracks do not play over one another. They switch at chapter changes rather than crossfading. Backward scrolling selects the corresponding earlier track.

The public page attempts low-volume playback as soon as content loads, unless autoplay is disabled in the studio. Browser policy may block sound before interaction; the first pointer or keyboard action retries directly. There is no Resume soundtrack message, track-title card, or credits panel in the visitor view.

The small ♫ button opens mute/unmute and volume only. No play or resume control is displayed. Mute lasts for the current visit and survives chapter changes; a fresh visit attempts playback again while retaining volume. After a video pauses the soundtrack, mute then unmute can restart it. Starting music pauses an open video. Preview never attempts autoplay. Technical credits remain available in the studio and this guide.

The default is nine different tracks. Administrators can choose any uploaded audio for each chapter or select no music. A pre-existing custom birthday music choice is retained for the invitation during first migration; other chapters receive the new instrumentals. Upload replacement MP3/WAV files through Photos & music and select them in the journey panel.

## Administrator controls

The **The keys to your new year** panel controls:

- Whether the keyed journey is enabled.
- Autoplay attempt, default volume, and motion intensity.
- Nine chapter titles, key names, unlock labels, and helper instructions.
- Chapter visibility and order.
- Unlock type from eight supported choices.
- Track selection for each chapter.
- An explicit action to place the new letter into an unsaved draft.

The existing **Divine Blessings** panel now also edits each image's theme, birthday blessing, and reveal style. Existing image order/visibility, featured starting image, video settings, and optional-interaction toggles remain available.

The main birthday message, letter, final wish, personal memory photos, and upload library remain editable in their existing panels. The old global music selector is labelled **Birthday music (legacy layout)**; keyed playback uses the nine chapter selectors.

Use **Save draft → Preview saved draft → Publish saved draft**. All new settings participate in strict server validation, signed preview URLs, snapshot publication, and reference/deletion safeguards. Hidden chapter and image references still protect saved files from deletion.

## Preserving newer local work

If you have edited the website on your PC since uploading:

1. Stop the old server.
2. Back up the entire old `data` folder.
3. Extract this ZIP into a different folder.
4. Replace that new installation's entire `data` folder with your newer backed-up folder.
5. Start the new version.

Do not overwrite your newer JSON with the older copy shipped in the ZIP. The delivered JSON remains byte-for-byte the uploaded version; startup migrates your actual local copy.

If the older blessings migration is still needed, it runs first and saves `data/birthday.before-blessings.json`. The keys migration then saves `data/birthday.before-keys.json`, adds missing journey settings, fills missing per-image blessing fields, and registers nine stable media records. Each migration increases the content revision once. Repeated startup does not duplicate records or reset edited/disabled chapters.

The keys migration replaces the old stock letter/final wish only when they exactly match the earlier supplied defaults. Custom text stays unchanged. Existing accounts, password hashes, sessions, music choices, media, and separate draft/published snapshots are preserved. A complete pre-update `data` backup is the simplest rollback path with the older project.

## Browser-local progress and privacy

Versioned browser storage remembers chapter keys, active chapter, revealed-image IDs, and the selected prepared blessing. Invalid JSON or obsolete chapter/image IDs are safely discarded or filtered. Stored audio preferences are separate. Unavailable storage does not block the journey.

Private paper-boat wish text is never placed in browser storage or sent to the server. It remains only in the mounted page and disappears on leaving, full reset, or replaying its chapter. No tracking, account sign-up, microphone, camera, or device permission is added.

## Motion and accessibility

See **ANIMATION-INVENTORY.md** for 60 named sequences, their targets, triggers, and reduced-motion behaviour. These are event-driven animations across the journey, not 60 concurrent effects. Offscreen chapter animations and animations in a hidden tab pause. Firefly loops are capped, particles and flowers are bounded, timers and observers are cleaned up, and global motion controls remain unlocked.

Every essential interaction is a native button or input. No action requires dragging, hover, precise movement, speech, or a timer. Chapter unlock focuses its heading. Dialogs use native modal focus containment, Escape support, and focus restoration. Long letter text is present in full without a typewriter wait.

## Verification and limits

`npm run build` builds production assets. `npm test` runs local API/storage and React interaction checks. Final results are recorded in **VERIFICATION-KEYS.md**.

Tests exercise actual local audio range delivery, nine distinct audio hashes, migrations, preview/save/publish, chapter order, protected media deletion, keys, prerequisites, direct access, replay/reset, saved progress, palette switching, sequential image reveal, selected-wish keepsake content, blocked/successful autoplay, delayed loaded settings, pause/mute preferences, scroll-based track selection, and existing birthday features.

Browser visual QA was unavailable in the execution environment. Responsive CSS is included, but final phone/tablet/desktop layout, real screen-reader behaviour, actual audible autoplay, native media playback, and perceived animation/audio quality require review in the target browser. Automated tests do not establish those outcomes. The Windows launcher was inspected, not executed on Windows.
