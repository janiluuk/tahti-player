# Player view on phones: drop the duplicate Add to playlist, add Love

**Status:** open

Requested 2026-11-22.

- In the player view (full-screen player, `components/FullScreenPlayer.tsx` / `NowPlayingOverlay.tsx`) on phones, remove the separate "Add to playlist" button. It is already in the overflow (dropdown) menu (`NowPlayingActionSheet.tsx`).
- Add a Love (favorite) icon button in its place, using the same favorite action and labels as the rest of the app (`web.actions` favorite / unfavorite, `soundLikesStore`).
- Desktop layout unchanged unless it has the same duplicate.
- Tests: FullScreenPlayer vitest at phone width (no Add to playlist button, Love toggles), Storybook story/play for the phone layout.
