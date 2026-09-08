# Admin plugin management panel (all Add-ons categories)

**Status:** partial

## Ask (user, 2026-09-08)

Under `/admin` → Manage, there should be a management section covering
**all** plugins (not just disco widgets / add-ons):

- Admin can set a plugin enabled-by-default for all users.
- Admin can set default settings for a plugin.
- Admin can edit plugin metadata.
- Plugin submissions should be visible there (a review queue).
- Filter plugins by which role they target — admin / listener / artist —
  separately.
- Every plugin must have its category defined.

## Shipped this pass (2026-09-08)

The user separately asked to rename "disco widgets" to "add-ons" (scoped to
the admin panel + its direct API, per an explicit scope choice — the
listener-facing runtime, `disco-widgets/` components, sandbox protocol,
and `Channel`/`Artist`/`ListenView` embeds were explicitly left alone and
still say "disco widget"). Renamed
`packages/tahti-web/src/views/admin/AdminDiscoWidgetsView.tsx` →
`AdminAddonsView.tsx` (component `AdminDiscoWidgetsView` →
`AdminAddonsView`), and `packages/tahti-web/src/api/admin.ts`'s
`AdminDiscoWidget`/`AdminDiscoWidgetScope`/`AdminDiscoWidgetStatus`/
`AdminDiscoWidgetPatch` types + `fetchAdminDiscoWidgets`/
`registerAdminDiscoWidget`/`patchAdminDiscoWidget`/
`deleteAdminDiscoWidget` functions → `AdminAddon*`/`fetchAdminAddons`/
`registerAdminAddon`/`patchAdminAddon`/`deleteAdminAddon`. Route
`/admin/disco-widgets` → `/admin/addons` (old path now redirects, same
convention as the governance-consolidation redirects). API path
`/api/admin/disco-widgets` → `/api/admin/addons` (no backend route exists
for either yet — this whole surface is still mock-only, see below).
`AdminNav.tsx`'s nav label "Disco widgets" → "Add-ons".

**Naming caveat for whoever picks up the rest of this ticket:** the admin
page is now titled "Add-ons," but it still only manages the `discovery`
category (sandboxed Listen-page widgets) — same one-category scope as
before, just renamed. `packages/tahti-web/PLUGIN-STORE-PLAN.md` /
`pluginStoreCategories.ts` already use "Add-ons" as the umbrella term for
all 13 plugin categories (themes, export, multicast, audio-plugins, etc.),
so "the Add-ons admin page" and "all Add-ons categories" (this ticket's
title) are not the same thing yet — the rename makes that naming collision
more visible, it doesn't resolve it. Resolving it is exactly this ticket's
still-open scoping question below (one unified `/admin/addons` across all
13 categories, vs. this page staying `discovery`-only under a now-
confusingly-generic name).

Also fixed the concrete "submissions should be visible" gap this doc had
already flagged for the one category with the data model for it:
`statusColor()` now branches all five `AdminAddonStatus` values
(`APPROVED` green, `PENDING` purple, `REJECTED` red, `DISABLED` orange,
`DRAFT` blue) instead of falling through to one default color for
everything but `APPROVED`/`DISABLED`; added a second `FilterChips` row
("All statuses" / "Needs review (N)") that filters the list to `PENDING`
add-ons. No moderation actions (approve/reject) were added — this pass is
visibility/filtering only, matching the doc's own framing of this as the
concrete missing piece, not the larger enabled-by-default/default-settings
asks below. `tsc --noEmit`, `eslint` clean. No existing tests referenced
the old names (none broke). Not live-browser-verified.

## Shipped this pass (2026-09-08, round 2)

**Correction to the previous pass's claim:** a real backend for this
category exists after all — `../tahti-org`'s
`apps/api/src/routes/admin/addons.ts`, and it's considerably more built
out than the frontend assumed: full moderation (`approve`/`reject`/
`disable`), a bundle upload + versioning system (`prepare-upload` →
`publish-version`, MinIO-backed, hash-verified, `packages/addon-sdk`),
and — directly relevant here — `POST .../:id/enabled-by-default` and
`POST .../:id/default-config` already existed, unused by this frontend.
`enabledByDefault: boolean` and `defaultConfigJson: unknown | null` are
real, typed fields (`AddonAdminItemSchema` in
`../tahti-org/packages/shared/src/dto/addons.ts`) on the real `Addon`
model, not something that needed inventing.

Also found and fixed a real bug blocking all of this from ever working
against a live backend: `fetchAdminAddons` read `data.addons`, but the
real `GET /api/admin/addons` responds `{ widgets: [...] }`. Every fetch
against a real API was silently returning an empty list; only mock mode
ever showed data.

Added:
- `AdminAddon.enabledByDefault` / `.defaultConfigJson` fields.
- `setAdminAddonEnabledByDefault(id, enabledByDefault)` and
  `setAdminAddonDefaultConfig(id, defaultConfigJson)` in `api/admin.ts`,
  same real/mock-branch convention as every other function in that file.
- `AdminAddonsView.tsx`: a visible "Enabled by default" `Toggle` on each
  add-on card (posts immediately, no separate save step, matching the
  moderation-action pattern the real backend expects) and a "Default
  settings" button opening a small dialog with a JSON-object textarea
  (parsed and validated client-side before `POST .../default-config`;
  empty clears the default, matching the endpoint's `null` semantics).

Verified: `tsc --noEmit` and `eslint` clean; `pnpm --filter
@tahti-player/storybook build` succeeds (exercises the full view via
`AdminAddonsView.stories.tsx`). Not live-browser-verified — no dev
server/backend/browser available in this session. No vitest test added:
this repo has no unit tests for any `views/admin/*` view (verified by
search) — Storybook + e2e are the established verification surfaces here,
and a new unit test would be going against that convention rather than
following it.

**New gap found, not fixed here:** the real backend has **no** generic
`PATCH /api/admin/addons/:id` (metadata edit) or `DELETE
/api/admin/addons/:id` route — only the specific POST actions listed
above. `patchAdminAddon`/`deleteAdminAddon` in `api/admin.ts` call routes
that don't exist server-side, so — like the `enabled-by-default`/
`default-config` gap before this pass — **metadata editing and deleting
an add-on only ever worked in mock mode**, never against a real backend.
Out of scope for this pass (the user's ask was specifically
enabled-by-default + default-settings); flagging for whoever picks up
metadata-edit/delete next, in either repo.

## What already exists (closest precedent, discovery category only)

`packages/tahti-web/src/views/admin/AdminAddonsView.tsx` +
`packages/tahti-web/src/api/admin.ts`'s `AdminAddon` already implement
most of this shape, but **only for the `discovery` category** (sandboxed
Listen-page widgets):

- `AdminAddonScope = 'LISTENER' | 'ARTIST' | 'ADMIN'` — a `SCOPES` filter
  chip row already exists in the view.
- `AdminAddonStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' |
  'DISABLED'` — the data model already has a submission/review lifecycle
  (`PENDING` = a submission); as of this pass the view has a "Needs
  review" filter chip and a distinct `PENDING` badge color (previously
  missing — see "Shipped this pass" above).
- Metadata editing (name/description/authorName/iconUrl) and `categories:
  string[]` tagging already work via `registerAdminAddon` /
  `patchAdminAddon`.
- ~~No "enabled by default for all users" toggle and no "default
  settings" concept exist~~ — **wrong, corrected 2026-09-08 round 2**: the
  real backend already had both (`enabledByDefault`,
  `defaultConfigJson`), just never wired up on this side — see "Shipped
  this pass (round 2)" above. Metadata edit and delete, on the other
  hand, genuinely have no backend route — the inverse of what this
  bullet originally claimed.

## Why this isn't a small "add a nav item" task

`packages/tahti-web/PLUGIN-STORE-PLAN.md` maps the other 12 categories in
`packages/tahti-web/src/content/pluginStoreCategories.ts` (themes, export,
import, multicast, fingerprinting, scrobbling, audio-plugins, tools,
radio, listen, channel) — most are **compile-time typed registries** (e.g.
`packages/tahti-web/src/plugins/multicast/`,
`packages/tahti-web/src/plugins/export/`), not runtime, admin-editable,
submittable entities
the way discovery add-ons are. Extending "admin management + submissions +
default-enable" uniformly to all 13 categories doesn't fit several of them
as currently built (a listener can't "submit" a new multicast RTMP
provider or a built-in theme). Before implementing, this needs a scoping
pass per category:

- Which categories are genuinely admin-governable/runtime (discovery
  certainly; audio-plugins' "host UI" is separately flagged as still open
  in the plan) vs. which are fixed, code-defined registries where "admin
  management" would mean something different (e.g. just
  visibility/enable-disable of the registry entry, not full CRUD +
  submissions).
- Whether this becomes one unified `/admin/addons` page across
  categories (reusing/expanding the just-renamed page), or a
  generalization of the existing pattern reused per-category under
  separate routes.
- The "category" field enforcement ask — decide whether category is the
  existing free-text `categories: string[]` tag list (discovery add-ons)
  or should map onto `PluginCategoryId` from
  `packages/tahti-web/src/content/pluginStoreCategories.ts` (the 13-value
  enum used everywhere else), since those are two different,
  currently-unreconciled notions of "category" in the codebase today.

## Related

- `packages/tahti-web/PLUGIN-STORE-PLAN.md` — per-category extraction
  status/ownership (read before scoping this).
- `packages/tahti-web/docs/PLUGINS.md` — the plugin contract shape the
  extractions follow.
- `packages/tahti-web/src/views/admin/AdminAddonsView.tsx` /
  `packages/tahti-web/src/components/PluginStorePanel.tsx` /
  `packages/tahti-web/src/content/pluginStoreCategories.ts` — the two
  existing surfaces this would need to reconcile.
- `/admin/addons` sits under the `operations` ("Manage") nav group in
  `packages/tahti-web/src/components/AdminNav.tsx` — a new unified plugins
  page belongs in the same group.
