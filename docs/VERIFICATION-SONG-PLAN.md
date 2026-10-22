# Requested-song configuration

Added a stable nine-song mapping in shared/song-plan.js, per-chapter recommendations and dedicated uploads in JourneyEditor, and an Admin upload destination that assigns the returned audio media ID only to the selected chapter. Actual uploaded filenames remain the track title; no existing instrumental is relabelled as a requested commercial recording. Existing draft edits, unrelated chapters and legacy music selection remain unchanged. Save/publish is still required.

The nine commercial recordings were not supplied, downloaded or bundled. Existing original tracks remain available. This release prepares their assignments but does not make the requested songs audible until the user supplies the audio.

Production build, 25 backend tests and 72 client tests passed (97 total). New tests cover all nine mappings, chapter-specific immutable assignment, invalid media/removed chapters, and all nine upload-field callbacks. DOM tests mock playback; actual supplied-song sound cannot be tested without the recordings. Existing data is preserved byte-for-byte.
