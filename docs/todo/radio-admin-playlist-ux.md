# Radio playlist manager access and UX

**Status:** partial

Requested 2026-11-24. Shipped in tahti-web 0.0.481: board members get an edit-playlist pencil on the Tahti Radio widget (`/admin/radio?tab=playlist`, same `BOARD` gate as `AdminGate`); the Add tracks picker keeps tracks picked under an earlier search, forgets the selection on cancel, has Select all shown with a live count, reports partial failures (keeps only the failed tracks selected) and confirms what was added.

## Left

- [ ] Ordering and current-track state in the rotation list (the on-air match is by title only).
- [ ] Phone layout of the manager (list actions, picker dialog).
- [ ] Concise labels pass on the Playlist tab.
