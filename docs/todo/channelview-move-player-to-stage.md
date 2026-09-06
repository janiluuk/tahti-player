# Channel Designer: move the player out of the backdrop into "Stage"

**Status:** blocked

Remaining item from a larger task (links prefill + Home→Stage rename +
per-link hide/show all shipped and folded to HISTORY.md).

## Move the player out of the backdrop into the "Home" (Stage) area

This is the same category of change flagged and deferred earlier
(`docs/todo/channelview-badge-dedup-and-share-modal.md`, "move the
player above the tabs") — extracting the hero block's player out of
the generic `renderBlock`/`visibleItems.map` data-driven layout loop
in `ChannelView.tsx` and giving it a fixed position is a real
structural change to a ~1600-line view's block-rendering system, not a
class-name tweak. That earlier item was resolved differently (the
Overview/Manage tabs it was originally about got replaced with a
Stream Manager modal instead), but this ask is a different, still-open
version of the same underlying question: where does "Stage" as a
distinct destination actually begin and end relative to the backdrop's
own header content? Needs a deliberate pass, ideally with the user's
input on exactly what the Stage area should look like once the player
moves — not a guess.
