# Fix Shift+click Play CI (post-#903)

**Status:** open

## Problem

PR #903 merged with red CI. `origin/master` still carries:

1. Player visual snapshot mismatches (Artist, FavoriteTracks, PlaylistDetail) from TrackTable thumb / MediaArtwork play control changes.
2. Storybook plays 3/6 and 6/6: `clickRowPlay` looks for exact `aria-label="Play …"` but MediaArtwork now sets `Play … · Shift+click to queue` when `onQueue` is set (`ArtistLikes`, `SmartLinkView`).

## Plan

- [ ] Update `clickRowPlay` to match aria-label prefix
- [ ] Refresh player snapshots locally with `-u`
- [ ] Open fix PR against master
