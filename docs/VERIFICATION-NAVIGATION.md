# Chapter navigation fix

The previous click handler started smooth scrolling before React collapsed the current chapter. The changing layout moved the requested destination, while intermediate IntersectionObserver callbacks could select and collapse another chapter. Navigation now waits for the committed layout, jumps to the explicitly requested section and focuses its heading. Clicked destinations stay selected until manual scrolling resumes. Manual scroll tracking reads all section positions and does not collapse an open chapter. Scroll anchoring is disabled within the journey. Dialog focus restoration no longer scrolls to its old trigger, and reset restores focus to sequence 01.

Production build passed. 25 backend tests and 67 client tests passed (92 total). Navigation regression tests exercise every Continue link, all nine map destinations, stale observer callbacks, visible-section selection, unchanged open content during manual scroll, entry/resume, replay/reset, prerequisite links and a reordered/shortened journey. The provided data directory is preserved byte-for-byte.

DOM tests mock geometry, scrolling and media playback. A real browser's physical scroll position, Windows execution and phone layout have not been directly verified in this environment.
