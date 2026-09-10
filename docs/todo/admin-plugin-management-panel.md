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

**Note:** a second, independent session found this exact same backend
around the same time and shipped a smaller additive fix (enabled-by-default
+ default-config only, leaving the broken metadata-edit/delete UI in place
and documented as a known gap — merged as PR #35). The pass below
supersedes it: same discovery, plus it also removes the broken edit/delete
UI and adds the real approve/reject/disable moderation actions PR #35
didn't attempt. Reconciled via `git merge` when this branch caught up to
master.

## Major correction (2026-09-08, later pass): the earlier "mock-only, no backend" claim was wrong

The first rename pass on this ticket (see "Shipped this pass" below) said
*"no backend route exists for either yet — this whole surface is still
mock-only"* and *"Both would need new API + schema work even for this
category"* for enabled-by-default/default-settings. **Both claims are
false** — found by grepping `../tahti-org` for `discoWidget`/`disco-widget`
(the OLD name), which correctly found nothing, and wrongly concluding no
backend existed at all, without also grepping for the generic term
`addon`. The real backend was there the whole time, under its own name,
independent of this repo's disco-widget→Add-ons rename:

- `packages/db/prisma/schema.prisma`'s `Addon`/`AddonVersion`/
  `AddonInstall` models — a **full widget-bundle store**: versioned JS
  bundles (`bundleKey`/`bundleHash`, sandboxed rendering), a moderation
  lifecycle (DRAFT → PENDING → APPROVED/REJECTED, DISABLED), per-scope
  installs (listener/channel/admin-surface), **and already has both
  `enabledByDefault: Boolean` and `defaultConfigJson: Json?`** — exactly
  the two fields this ticket's ask wanted, already modeled.
- `apps/api/src/routes/admin/addons.ts` — real routes: `GET/POST
  /api/admin/addons`, `prepare-upload`/`publish-version` (bundle upload),
  `approve`/`reject`/`disable` (moderation), `default-config` and
  `enabled-by-default` (POST, one action each — **not** a generic PATCH),
  plus ADMIN-scope install CRUD (`/api/admin/addons/installs`).
- This is a fundamentally different shape than what this repo's
  `AdminAddon`/`AdminAddonsView.tsx` assumed after the rename: no generic
  PATCH/DELETE for an addon's own record exists server-side at all (only
  the specific action endpoints above), and the list response key is
  `widgets`, not `addons` — the rename-pass frontend's `patchAdminAddon`/
  `deleteAdminAddon` and `{ addons: [...] }` parsing would have silently
  done nothing / returned an empty list against the real API the moment
  mock mode was off, with no error surfaced.

**Fixed this pass**, all in this repo (no `../tahti-org` changes needed —
the backend was already complete): rewrote `admin.ts`'s Add-ons section to
match the real contract — `AdminAddon` gained `defaultConfigJson`/
`enabledByDefault`; `fetchAdminAddons` reads `widgets` not `addons`;
`patchAdminAddon`/`deleteAdminAddon` (no server equivalent) replaced with
`approveAdminAddon`/`rejectAdminAddon`/`disableAdminAddon`/
`setAdminAddonEnabledByDefault`/`setAdminAddonDefaultConfig`, each POSTing
to its own action endpoint. Rewrote `AdminAddonsView.tsx`: removed the
per-item "Edit" pencil (no metadata-edit endpoint exists server-side —
keeping a UI that silently no-ops against real prod would be worse than
not having it) and the "Delete" trash icon (no DELETE-the-addon route
exists — replaced with "Disable," which is the real terminal action and
matches the backend's own "only a fresh bundle publish brings it back"
semantics); added Approve/Reject icon buttons on PENDING cards (Reject
requires a moderation note, server-enforced `min(1)`); added a "Manage"
dialog on APPROVED cards with the `enabledByDefault` `Toggle` and a
`defaultConfigJson` JSON textarea (client-validated before sending) —
**the literal original ask, now real**. "Register a new add-on" still
only sets metadata (matches the real `POST /api/admin/addons` fields) —
a newly-registered addon stays in DRAFT, invisible everywhere, until a
bundle version is published; **no UI for authoring/uploading that JS
bundle exists anywhere in this repo** and wasn't attempted this pass (a
real, separate, larger feature — needs a product decision on where the
bundle comes from, e.g. a widget SDK/build step) — the dialog's copy says
so explicitly so nobody mistakes "registered" for "usable."

Added 2 tests in `admin.test.ts` locking in the two contract bugs found
(`widgets` response key, real per-action `approve` endpoint vs. a generic
PATCH) so a future pass can't silently regress either. `tsc --noEmit`,
`eslint` clean, full `pnpm vitest run` (497/497) and `pnpm --filter
@tahti-player/storybook build` (the existing `AdminAddonsView.stories.tsx`
still renders) both pass. Not live-browser-verified, and this pass did
**not** attempt: bundle upload/publish UI, ADMIN-scope install management
(the `/api/admin/addons/installs` CRUD — installing an addon onto a
shared admin surface like the homepage), or the still-open "all 13
categories" scoping question below (unchanged by this pass — this addon
system only covers the `discovery`/Add-ons category, same as before).

## Shipped this pass (2026-09-08, first pass — rename)

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
- Metadata (name/description/authorName/iconUrl/categories) can only be
  set at registration (`registerAdminAddon`) — there's no edit endpoint,
  see the correction above.
- **Done** (2026-09-08, see correction above): "enabled by default for all
  users" (`enabledByDefault` Toggle) and "default settings"
  (`defaultConfigJson` JSON editor) both exist now, backed by a real,
  already-built `../tahti-org` API — no schema work was needed, the
  backend already modeled exactly this.

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
