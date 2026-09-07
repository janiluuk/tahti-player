# Port mobile player/nav + Tahti-theme visuals from `apps/web`

**Status:** partial
**Repo:** this checkout (`tahti-nuclear` / Tahti Player). Source of truth for look-and-feel: sibling `../tahti-org`.

Three related ports. Done when a phone-width Tahti-theme session can: navigate from a slim bottom bar with a lit active section, keep a compact player stacked on that bar, open fullscreen player with visualizations, see cover-art glow on thumbnails, and see the Discover gateway background viz.

## 1. Mobile player + bottom navigation — shipped (0.0.86)

- Compact player no longer hides on mobile while playing.
- Player stacks above the slim bottom nav in the mobile shell.
- Bottom bar: Listen / Discover / Radio / More. Artists and board also get Studio. Queue lives on the player bar. Library and other destinations open from More (existing navigate drawer).
- Active tab uses `text-primary`. More lights for Library / Settings / Help / Admin / Governance (and Studio when it is not a primary tab).
- Fullscreen player `z-[60]` so it sits above the nav.
- Help copy updated. Storybook: slim nav variants + stacked playing chrome. Playwright Library path goes through More.

Verify at 375px: play a track → bar visible above nav → expand fullscreen → dismiss → nav still shows the correct active section → tap another tab.

## 2. Thumbnail backdrop ambience (Tahti theme)

Still open — see original spec below.

**Attempted and reverted (2026-09-07):** wrapped each `Card` in
`DirectoryArtistCardGrid.tsx` with a `-inset-N -z-10 blur-* opacity-*`
div painting `--card-bg-image` behind it, same technique as
`.listen-card::before`. Live-verified on `/discover` → Artists: doesn't
work here. `Card` (`packages/ui`) is **fully opaque**
(`bg-primary`/hard `shadow-shadow`, not `apps/web`'s translucent
`rgba(255,255,255,0.03)` glass card) and `CardGrid` only has a `gap-4`
(1rem) gutter between cells — so the glow has almost no opaque-free area
to bleed into. A small inset+blur produced a thin, confusing color ring
that reads as a rendering glitch, not ambience; a larger inset/blur only
showed faintly above the top row (nothing to occlude it there) and was
invisible between/below other cards. **This needs a different technique
than a direct port**, not just tuned numbers — e.g. blurring the page
background behind the whole grid instead of per-card, or a bigger
grid `gap` specifically to give per-card glows room, or giving `Card`
itself a translucent variant. Left `Card`/`DirectoryArtistCardGrid`
unchanged.

## 3. Discover-page background visualization (Tahti theme)

Still open.

## 4. Storybook

Shipped for the chrome stack. Still needed: thumbnail glow + Discover gateway viz stories.

---

## Why the remaining pieces are still broken

- Thumbnail glow (`--card-bg-image` blur wash) lives on `apps/web` listen/directory cards, not in the Tahti theme card chrome here.
- Discover in `apps/web` sits on the persistent gateway `BgCanvas` (`subtle`). Player Discover uses `AmbientBackground` / `ChannelVisualizer`, and only when ambient is enabled for Tahti themes — it does not match the gateway scene.

### Thumbnail reference (`../tahti-org`)

Every listen/live/directory card paints a blurred blow-up of its own cover/avatar behind the row (`.listen-card::before` / `--card-bg-image`).

### Discover reference (`../tahti-org`)

`/listen` uses `BgCanvas variant="subtle"`, not a channel preset.

## Out of scope

- Changing Tahti org `apps/web` except if a missing API/palette field is discovered (then a sibling PR).
- Porting every M31 channel visualizer preset (already partially in `ChannelVisualizer`); this task is gateway Discover + card glow + mobile chrome/player viz.
- Desktop sidebar density.
