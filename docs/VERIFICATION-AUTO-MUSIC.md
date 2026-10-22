# Automatic soundtrack arrival update

Removed the remaining Turn music on / play-pause control from sound settings. The menu now contains mute/unmute and volume only. Each fresh public visit attempts the first sequence track regardless of a previous visit's saved pause/mute. Volume remains saved. Mute during the current visit still stops automatic attempts across chapter changes. Studio autoplay-off and previews remain silent.

When browser autoplay is blocked, pointer down/up, click, touch completion and keyboard events retry directly without a prompt. Concurrent play attempts are guarded. The existing nine unique original instrumentals and fixed chapter navigation remain intact.

Validation: production build passed, 25 backend tests and 68 client tests passed (93 total). Tests cover fresh playback with stale saved silence/mute, current-visit mute across tracks, no Turn music on control in expanded settings, blocked touch/keyboard/pointer retry, and the existing nine-track and navigation regressions. Supplied data files remain byte-for-byte unchanged.

DOM media playback is mocked. Browser audible autoplay before interaction cannot be guaranteed by JavaScript. Real device audio and visual QA remain target-computer checks.
