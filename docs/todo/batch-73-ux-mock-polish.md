# Batch 73 — UX / mock polish (20 slices)

**Status:** open

Next usability pass after batches 71–72. Prefer Storybook `@tahti-player/ui`,
no invented API, honour `prefers-reduced-motion`. Sources: `MOCKS.md` thin
spots, `NAVIGATION-GAPS.md`, empty-state consistency, phone layout.

| # | Slice | Size | PR |
| --- | --- | --- | --- |
| 1 | Radio hub links Schedule / booking (already shipped — docs sync) | S | this PR |
| 2 | Press-kit gallery upload works under mock (no bare link-out) | S | this PR |
| 3 | Member invite flow works under mock (toast + list refresh) | S | this PR |
| 4 | Mark MOCKS “richer archive” shipped; drop stale Jam gap note in NAVIGATION-GAPS | XS | this PR |
| 5 | Studio Updates empty uses EmptyState + write CTA | XS | this PR |
| 6 | Studio Revenue empty / disconnected uses EmptyState copy | XS | |
| 7 | GlobalSearch no-results EmptyState | XS | |
| 8 | Favorites empty: signed-out vs listener copy (no upload CTA) | XS | |
| 9 | Feed empty signed-out offers Sign in + Discover | XS | this PR |
| 10 | Library Collections empty for listener (follow/Discover, not upload) | XS | |
| 11 | Help search no-results EmptyState | XS | |
| 12 | Discover tab empty section EmptyState | XS | |
| 13 | Channel offline / empty tracklist EmptyState consistency | S | |
| 14 | Studio Stash empty EmptyState + Upload CTA | XS | |
| 15 | AuthDialog field errors exposed to `aria-live` | S | this PR |
| 16 | Skip-to-content target focus ring visible on all themes | XS | this PR |
| 17 | Settings deep-link scrolls active section into view | S | this PR |
| 18 | Mock gated track page fixture (subscriber / purchase) for capture | S | |
| 19 | Tag search empty (no fixture match) uses EmptyState, not blank | XS | |
| 20 | Plan + INDEX; fold when open PRs merge | XS | this PR |
