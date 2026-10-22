# Verification — creative edition

- Runtime: Linux, Node.js 24.19.0.
- Production build: passed, Vite 8.3.4.
- Server tests: 25 passed.
- React/interaction tests: 59 passed.
- Total: **84 tests passed**.
- Animation inventory: 79 unique named sequences, each with a keyframe and a connected implementation reference.
- Audio: nine distinct original MP3s; file sizes and durations validated, and actual local HTTP range delivery tested.
- Devotional media: 13 unique originals retained; sequential display, thirteen reveal styles, video delivery and reference safeguards tested.
- Source data: birthday.json and uploaded media compared against the user's current uploaded ZIP before packaging. The supplied reference portrait is used for colour sampling only, not embedded in the website.
- ZIP: required code/startup/docs/assets, integrity and exclusion of dependencies/caches verified before delivery.

New checks exercise bounded scratch coverage without pixel reads, pointer scratching, direct/reduced-motion reveal, lantern keyboard changes and settling, timer cancellation, cabinet range/leaf arrangement, seam tracing, fresh-first music, explicit saved-chapter resume, entrance-click audio fallback, absence of a prominent Play button, all image-specific reveals, theme text contrast, migration preservation, bounded settings validation, credits and central-wish save/preview/publish.

Existing tests cover keys, prerequisites, replay/reset, progress corruption, brown/green reversal, chapter order, nine-track delivery, pause/mute preferences, video/music coordination, original birthday interactions, private previews and deletion protection.

DOM tests mock canvas drawing and actual media playback where appropriate; scratch coverage and scene state transitions are exercised independently. HTTP media delivery is separately tested through Express. Automated tests do not prove perceived animation quality or actual audible browser playback.

Real-browser visual/responsive QA, subjective listening, screen-reader review, physical phone touch testing and Windows execution were unavailable. These remain target-device checks. Browser autoplay restrictions are handled with the entrance click; audible autoplay before interaction is not guaranteed. No unapproved commercial songs were downloaded or represented as included.
