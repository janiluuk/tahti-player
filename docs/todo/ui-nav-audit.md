# Tahti Player — UI & navigation audit

**Status:** partial  
**Audited:** 2026-10-05  
**Scope:** `packages/tahti-web` navigation chrome and crowded studio/settings
surfaces. tahti-org excluded. Canvas:
`tahti-player-ui-nav-audit.canvas.tsx` (Cursor canvases).

## Consistency rule

On every subsection page, **left sidebar and top tabs** should both show the
active section. Broken today for several Listen / Library / Studio / Settings
paths.

## Phases (fix order)

| # | Phase | Status | Detail |
| - | ----- | ------ | ------ |
| 1 | Listen allowlist | done | `/u/`, `/search`, `/v/` in `isListenSidebarRoute` (+ mobile) + tests |
| 2 | Settings modal highlight | done | Sidebar Settings lit while `useSettingsModalStore.isOpen` |
| 3 | Library Upload tab | done | `LIBRARY_SECTION_TABS` + mount tabs on `StudioUploadView` |
| 4 | Studio↔Library catalog chrome | done | Drop catalog paths from Studio `SECTION_PREFIXES`; Library sidebar + `LibrarySectionTabs` on sounds/collections/upload; branding → settings |
| 5 | Account / Broadcast splits | done | Go Live tabs (Prep · Credentials · Recording · Destinations · Green room); Settings↔Broadcast deep links; Channel → session links; dead non-global `StudioNav` swept |
| 6 | Channel page redesign | open | See `channel-page-redesign.md` — visual redesign still needs a reference; beta verify leftover. Edit mode (`?edit=`) + nav tabs already land; no further light split in phase 10 |
| 7 | Admin Radio tabs | done | Feature · Presets · Opt-outs · History (`?tab=`) |
| 8 | Release detail tab URLs | done | Existing six tabs sync to `?tab=` (smart-links, credits, …) |
| 9 | Catalog twin (sounds) | done | `/library/sounds` mounts `StudioSoundsView`; `/studio/sounds` + `/studio/archive` redirect |
| 10 | Collections twin + Settings panels | done | `/library/collections` mounts `StudioCollectionsView` (+ subscribed); `/studio/collections` + `/studio/playlists` redirect; Notifications / Mentions cards use `StudioPanel` (#541, #542) |

## Leftovers after phases 1–10

- Channel page visual redesign + beta check (`channel-page-redesign.md`).
- Optional: true child routes under `/studio/releases/$id/...` instead of `?tab=` only.
- Moderator role decision (`settings-audit.md`).

## Nav highlight gaps

All six rows from the first audit are resolved (checked 2026-10-15): `isListenSidebarRoute` covers `/u/*`, `/search` and `/v/*`; `/studio/sounds`, `/studio/collections` and `/studio/playlists` redirect to Library (phases 9-10); Library has an Upload tab; the Settings sidebar item stays lit while the modal is open; and `StudioNav`'s no-op `global` prop is gone, since only `AppShell` and the Storybook stories mount it.

## Crowded views to split (phases 5–6+)

1. Account settings — four groups; Governance out (`settings-audit.md` mostly done)
2. Channel page — view vs edit (`channel-page-redesign.md`)
3. Broadcast overlap — Go Live vs Settings vs Channel
4. Artist settings — Profile · Connections · Branding · Release defaults
5. Go Live — Prep · Credentials · Recording · Destinations · Green room
6. Release detail — child routes under `/studio/releases/$id/...`
7. Admin radio — Feature · Presets · Opt-outs · History
8. Channel settings — hide placeholders (done in settings-audit)

## Key files

- `packages/tahti-web/src/lib/navigationActive.ts`
- `packages/tahti-web/src/components/StudioNav.tsx`
- `packages/tahti-web/src/components/AppShell.tsx`
- `packages/tahti-web/src/views/LibraryView.tsx`
- `docs/todo/settings-audit.md`, `channel-page-redesign.md`

## Out of scope

tahti-org apps/web nav; atlas-navigation-structure-widget (draft only).
