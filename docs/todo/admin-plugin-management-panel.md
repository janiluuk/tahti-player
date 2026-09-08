# Admin plugin management panel (all Add-ons categories)

**Status:** open

## Ask (user, 2026-09-08)

Under `/admin` → Manage, there should be a management section covering
**all** plugins (not just disco widgets):

- Admin can set a plugin enabled-by-default for all users.
- Admin can set default settings for a plugin.
- Admin can edit plugin metadata.
- Plugin submissions should be visible there (a review queue).
- Filter plugins by which role they target — admin / listener / artist —
  separately.
- Every plugin must have its category defined.

## What already exists (closest precedent, discovery category only)

`packages/tahti-web/src/views/admin/AdminDiscoWidgetsView.tsx` +
`packages/tahti-web/src/api/admin.ts`'s `AdminDiscoWidget` already
implement most of this shape, but **only for the `discovery` category**
(sandboxed Listen-page widgets):

- `AdminDiscoWidgetScope = 'LISTENER' | 'ARTIST' | 'ADMIN'` — a `SCOPES`
  filter chip row already exists in the view.
- `AdminDiscoWidgetStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' |
  'DISABLED'` — the data model already has a submission/review lifecycle
  (`PENDING` = a submission), but the view has **no dedicated queue/filter
  for `PENDING`** today — `statusColor()` only branches on `APPROVED` and
  `DISABLED`, everything else (including `PENDING`) falls through to the
  default badge color, and there's no "needs review" filter chip. So the
  ask's "submissions should be visible" is a real, currently-missing gap
  even for the one category that has the data model for it.
- Metadata editing (name/description/authorName/iconUrl) and `categories:
  string[]` tagging already work via `registerAdminDiscoWidget` /
  `patchAdminDiscoWidget`.
- **No "enabled by default for all users" toggle and no "default settings"
  concept exist anywhere in `AdminDiscoWidget`** — `status: DISABLED` is a
  global kill switch, not a per-user default-state control, and there's no
  settings/config field on the type at all. Both would need new API +
  schema work even for disco widgets, before this ask can be met.

## Why this isn't a small "add a nav item" task

`packages/tahti-web/PLUGIN-STORE-PLAN.md` maps the other 12 categories in
`packages/tahti-web/src/content/pluginStoreCategories.ts` (themes, export,
import, multicast, fingerprinting, scrobbling, audio-plugins, tools,
radio, listen, channel) — most are **compile-time typed registries** (e.g.
`packages/tahti-web/src/plugins/multicast/`,
`packages/tahti-web/src/plugins/export/`), not runtime, admin-editable,
submittable entities
the way disco widgets are. Extending "admin management + submissions +
default-enable" uniformly to all 13 categories doesn't fit several of them
as currently built (a listener can't "submit" a new multicast RTMP
provider or a built-in theme). Before implementing, this needs a scoping
pass per category:

- Which categories are genuinely admin-governable/runtime (discovery
  widgets certainly; audio-plugins' "host UI" is separately flagged as
  still open in the plan) vs. which are fixed, code-defined registries
  where "admin management" would mean something different (e.g. just
  visibility/enable-disable of the registry entry, not full CRUD +
  submissions).
- Whether this becomes one unified `/admin/plugins` page across
  categories, or a generalization of the existing `/admin/disco-widgets`
  pattern reused per-category.
- The "category" field enforcement ask — decide whether category is the
  existing free-text `categories: string[]` tag list (disco widgets) or
  should map onto `PluginCategoryId` from
  `packages/tahti-web/src/content/pluginStoreCategories.ts` (the 13-value
  enum used everywhere else), since those are two different,
  currently-unreconciled notions of "category" in the codebase today.

## Related

- `packages/tahti-web/PLUGIN-STORE-PLAN.md` — per-category extraction
  status/ownership (read before scoping this).
- `packages/tahti-web/docs/PLUGINS.md` — the plugin contract shape the
  extractions follow.
- `packages/tahti-web/src/views/admin/AdminDiscoWidgetsView.tsx` /
  `packages/tahti-web/src/components/PluginStorePanel.tsx` /
  `packages/tahti-web/src/content/pluginStoreCategories.ts` — the two
  existing surfaces this would need to reconcile.
- `/admin/disco-widgets` sits under the `operations` ("Manage") nav group
  in `packages/tahti-web/src/components/AdminNav.tsx` — a new plugins page
  belongs in the same group.
