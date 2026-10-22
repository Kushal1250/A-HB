# Memory Key button fix

Chapter 06 can now unlock independently with its own Memory Key. Both canUnlock and the turn-key settings are corrected in shared defaults and saved draft/published snapshots. The previous Growing Key exception remains intact. Other chapter prerequisites are unchanged.

Validation: production build, 25 backend and 74 client tests passed (99 total). The new regression starts with no prior keys, verifies Choose the Memory Key without a previous-chapter link, keeps content hidden until the key is used, opens the memory cabinet, and verifies saved progress. Real local server startup and public API settings passed. Existing songs, photos and accounts are retained unchanged. Real-browser visual QA remains a target-device check.
