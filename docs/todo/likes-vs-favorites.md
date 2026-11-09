# Likes vs favorites: one heart, two features

**Status:** open

Found while writing e2e coverage (2026-11-09): the heart on a track row (artist
page, track lists) is a **like** (`Like X (n likes)`, server engagement), but
Library → Favorites lists **favorites**, and its empty state says "Heart a
track on its page or in any track list". Liking a track from a list never puts
it in Favorites, so the hint is wrong and the two hearts look identical.

## Decide

- [ ] Merge them (a like is the favorite; Favorites lists liked tracks), or
- [ ] keep both but give them different icons/labels (e.g. like = heart,
  save = bookmark) and fix the Favorites empty-state copy.

Then add the e2e: heart a track in a list → it shows in Library → Favorites.
