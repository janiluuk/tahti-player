# Audio plugins/add-ons: Reference Match rename, icon toggle, access tier

**Status:** done (2026-09-05).

## What shipped

`packages/tahti-web/src/content/pluginStoreCategories.ts`:
- Category `audio-plugins`'s `label` renamed "Audio plugins" → "Audio tools".

`packages/tahti-web/src/components/PluginStorePanel.tsx`:
- The "Mastering (reference matching)" row is now named "Reference
  Match" with `author="Pro Editor"` (previously "Client-side · always
  available"), matching how the actual Pro Editor DSP chain plugins
  listed right below it already show `author="Pro Editor"` — the
  in-code comment there had explicitly called out these as two
  differently-named "Mastering" things (this client-side reference-track
  matcher vs. the Pro Editor's own EQ/Comp/Limiter/Filter chain panel
  also confusingly labeled "Mastering"); renaming resolves that
  confusion rather than papering over it.
- `AudioPluginToggleRow`'s accessory changed from a `Toggle` switch to
  an icon-only `PowerIcon` button (`Tooltip` + `aria-label`,
  `variant="default"` when active / `"secondary"` when inactive,
  `aria-pressed`) — this affects every row in the Audio tools category
  (Reference Match + all Pro Editor DSP plugins), not just the renamed
  one, since they share the same row component.
- Access tier: the category list (`PLUGIN_CATEGORIES.filter(...)` in
  `PluginStorePanel`) already had a role gate for `tools` (board-only,
  `hasAccountRole(user, 'BOARD')`) but no gate at all for
  `audio-plugins` — any signed-in listener could see it. Added
  `isArtistOrAbove = Boolean(user && getAccountRole(user) !== 'LISTENER')`
  (the same "artist and above" idiom already used in `api/admin.ts` for
  `fanSubscriptionsAsArtist`/`stripeConnectChargesEnabled`) and gated
  `audio-plugins` on it.

## Verification

`tsc --noEmit`, `eslint`, and `pnpm --filter @tahti-player/tahti-web
build` all clean. No existing test file for `PluginStorePanel.tsx`;
none added (this component has no test coverage at all today — out of
scope to add a first one as part of this small change). Not manually
verified in a running browser — worth confirming the new access gate
actually hides the category for a LISTENER-tier account, and that the
icon button's active/inactive states read clearly without the removed
Toggle switch alongside it.
