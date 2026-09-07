# Listen page "Continue listening" card doesn't reflect play state

**Status:** open

Reported 2026-09-07: the "Continue listening" card's play button never
switches to a pause icon when that track is the one currently playing.

## Found

`ListenView.tsx`'s "Continue listening" `Card` (~line 216) passes
`onPlay={() => play(lastPlayed.playable)}` but never passes `isPlaying`:

```tsx
<Card
  title={lastPlayed.playable.title}
  subtitle={lastPlayed.playable.artist}
  src={lastPlayed.playable.coverUrl ?? placeholderArtworkUrl(lastPlayed.playable.id)}
  onPlay={() => play(lastPlayed.playable)}
/>
```

`Card`/`MediaArtwork` (`@tahti-player/ui`) already support an `isPlaying`
prop that swaps the hover play icon for a pause icon — every sibling
control on this same page wires it up correctly, e.g. the very next
block, `RadioListItem`, passes `isPlaying={radioIsPlaying}`. This card
is just missing the prop, not a deeper bug.

## Fix

Derive `isPlaying` the same way other Listen-page play controls do
(compare the player store's current track id/status against
`lastPlayed.playable.id`) and pass it to this `Card`, plus toggle
pause instead of always restarting when clicked while already playing
(matching the `playQueueFavoriteActions` convention referenced in
`docs/todo/HISTORY.md`'s "save/delete UX consistency audit" entry —
check `usePlayerStore`'s `currentId`/`status` and how other Listen
cards compute their own `onPlay`/`isPlaying`, e.g. the artist directory
grid, before implementing, rather than guessing at a new pattern).
