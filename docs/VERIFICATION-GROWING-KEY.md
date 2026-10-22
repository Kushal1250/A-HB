# Growing Key fix

Removed chapter 04's previous-chapter prerequisite through canUnlock, while retaining its own key interaction. Missing/unknown chapters still cannot be unlocked. Renamed Seed Key to Growing Key and changed its water action to a turn-key action in shared defaults and both saved snapshots. Songs, photos, messages, and administrator accounts remain intact.

Production build and 98 automated tests passed (25 backend, 73 client). New regression coverage starts with no collected keys, confirms Choose the Growing Key is visible without a Return to the previous chapter link, unlocks chapter 04 and checks progress. Existing navigation tests reflect the intentional chapter-04 exception. A real localhost server start and /api/birthday response confirmed the published settings. Browser visual QA remains a target-device check.
