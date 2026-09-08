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
- **No "enabled by default for all users" toggle and no "default settings"
  concept exist anywhere in `AdminAddon`** — `status: DISABLED` is a
  global kill switch, not a per-user default-state control, and there's no
  settings/config field on the type at all. Both would need new API +
  schema work even for this category, before this ask can be met. (Also
  note: no backend route for this category exists in `../tahti-org` at
  all yet — `fetchAdminAddons`/etc. only work today via the mock branch;
  the "new API work" this bullet flags would be new work on both sides,
  not just extending an existing route.)

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
