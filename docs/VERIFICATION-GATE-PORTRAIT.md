# Portrait in place of the flower pot

GreenhouseGate now accepts an optional portraitSrc. Sequence 02 supplies the local portrait route. Only that mode replaces the flower and pot with a framed SVG image; other greenhouse instances retain their existing artwork. The surrounding gate and foliage remain. The source PNG is unmodified and stored in git-ignored local data. An accessible SVG label describes the portrait, and missing-image feedback occupies the same frame.

Production build and all 93 existing automated tests passed. A real localhost check confirmed the image endpoint returns the exact supplied PNG. Existing navigation tests render the unlocked sequence 02. Existing project data is preserved byte-for-byte, with the portrait added separately. Physical browser layout and image appearance remain target-device checks.
