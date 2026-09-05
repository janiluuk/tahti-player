# Studio Storybook primitive sweep

**Status:** partial
Branding / radio playlist / Shows FilterChips, Sounds/Stash/Recordings/
Venues/Shows/Stats EmptyState).

2026-09-04: `StudioSoundsView`'s "Uploaded to" date filter (a hand-rolled
`<label><input type="date">` sitting next to an already-`Input`-based
"Uploaded from") now uses `Input type="date"` too. Checked `StudioSoundView`,
`StudioCollectionsView`, `StudioScheduleView` — their date fields already use
`Input`. No further hand-rolled empty-state `<p>` found via a text-pattern
search of Studio views in this pass, but that search was not exhaustive.

Further Studio EmptyState / remaining chip groups remain.
