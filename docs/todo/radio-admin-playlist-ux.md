# Radio playlist manager access and UX

**Status:** open

Requested 2026-11-24.

- Add an admin-only edit-playlist icon to the Tahti Radio widget, linking to the existing `/admin/radio?tab=playlist` manager. Match the existing authorization gate.
- Sweep the playlist manager for usability and simplicity: clear primary actions, understandable ordering/current-track state, efficient adding/removing/reordering, concise labels, accessible controls and phone layouts.
- Reuse existing contracts and shared UI; verify permissions and navigation in tests and Storybook.
