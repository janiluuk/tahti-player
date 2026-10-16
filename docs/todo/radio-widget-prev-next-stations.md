# Radio widget prev/next stations

**Status:** partial

## Ask

When playing a station from the Listen Radio row, if the row has previous or next stations, the player bar prev/next controls should switch stations.

## Done

1. `playFromList` on the player store seeds the full ordered list.
2. Listen Radio row and Listen add-on Radio Browser stations play via that list (skipping rows without a stream).
3. Store tests cover next/previous neighbors and end no-ops.

## Left

- Merge PR; fold this todo.
