# Garden entrance portrait

Replaced the sequence 02 greenhouse/flower-pot artwork with the supplied portrait. The image is served by a local API route from git-ignored data/garden-entrance.png. It is mounted only in the unlocked entrance chapter. The frame uses fluid sizing and a 3:4 image area; the source photo has not been edited. A readable placeholder handles a missing photo. Other photos, snapshots, accounts and audio files are retained unchanged.

Validation: production build and 93 existing automated tests passed. A real localhost HTTP check returned the exact uploaded PNG bytes with image/png; foreign-origin access returned 403. Existing navigation tests still exercise unlocking sequence 02, so its new markup renders successfully. Real browser visual/phone review remains to be done on the target computer.
