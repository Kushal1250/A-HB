# Verification for the keys edition

- Runtime: Linux, Node.js 24.19.0.
- Production build: passed with Vite 8.3.4.
- Server tests: 22 passed, 0 failed.
- React/interaction tests: 48 passed, 0 failed.
- Total: **70 tests passed**.
- Audio: nine distinct MP3 file hashes; each file's duration validated with ffprobe. Local published media range requests return HTTP 206 and audio/mpeg.
- Video: supplied H.264/AAC MP4 retained; local upload, signed preview, publication, deletion safeguards, and range delivery tested.
- Animation catalogue: 60 unique named entries, each with a CSS keyframe and an implementation reference. This establishes the authored catalogue and targets, not subjective visual quality.
- Data: packaged birthday.json compared byte-for-byte with the user's uploaded project. Source media compared with the supplied originals. Migrations tested using disposable directories.
- ZIP: integrity, required startup/source/manifest files, source originals, and exclusion of node_modules/caches checked before delivery.

The tests include the existing birthday experience and the new keys, chapter settings, content migration, save/preview/publish, media references, brown/green palettes, one-image devotional sequence, browser progress, replay/reset, selectable-wish keepsake, music following chapter changes, successful/blocked autoplay, delayed loaded audio settings, pause/mute preferences, and video/music coordination.

Media play/pause in DOM interaction tests is mocked because jsdom does not implement actual playback. Audio/video HTTP delivery is separately exercised through the real local Express app. These checks do not prove audible autoplay or device playback.

Real-browser visual and responsive QA, screen-reader review, subjective listening, and Windows execution were unavailable in this environment. They remain to be checked on the target computer. Browser autoplay policies can require the visitor to press Enter with music. No guarantee of audible autoplay is made.
