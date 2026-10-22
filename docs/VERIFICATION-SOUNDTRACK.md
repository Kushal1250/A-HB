# Quiet automatic soundtrack update

Removed the prominent soundtrack card, track name, credits, blocked-playback hint and Resume soundtrack label. Optional sound settings remain behind the small musical-note button. Content attempts playback on load and retries inside the first pointer/keyboard event if browser policy rejects the attempt. Explicit silence/mute remains respected; autoplay cannot be guaranteed before interaction.

Verification: production build passed; 25 backend tests and 62 client tests passed. Tests include blocked autoplay, pointer/keyboard retry, listener cleanup, silence preferences, source changes through all nine chapters on one looping audio element, media coordination and nine local-track HTTP delivery. Both supplied snapshots reference nine different bundled tracks; their file hashes differ. Saved project data was not edited.

Media playback is mocked in DOM tests. Audible browser autoplay, listening quality, physical-device controls, Windows execution and visual appearance still require target-device checks. No commercial song recordings have been added; the existing nine original instrumentals are retained.
