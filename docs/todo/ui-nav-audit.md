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
| 6 | Channel page redesign | open | See `channel-page-redesign.md` |

## Leftovers after phases 1–5

- Full merge of `/studio/sounds` list into `/library/sounds` (both UIs still exist; chrome now agrees Library owns catalog).
- Account settings panel component unification (`settings-audit.md`).
- Phase 6: channel page redesign.
- Crowded splits still open: Release detail child routes, Admin radio tabs, Go Live already tabbed.

## Nav highlight gaps

| Sev | Surface | Routes | Fix |
| --- | ------- | ------ | --- |
| High | Listen sidebar | `/u/*`, `/search`, `/v/*` | Extend `isListenSidebarRoute` |
| High | Studio top tabs | `/studio/sounds*`, `/collections*`, `/branding` | Library chrome / redirects |
| High | Library tabs | `/library/upload` | Upload tab |
| Med | Settings sidebar | Settings modal open | `isSelected` from store |
| Med | Dead `StudioNav` | Views with `<StudioNav />` sans `global` | No-op today — replace with real tabs or delete |
| Low | Catalog twins | `/library/sounds` vs `/studio/sounds` | One home per intent (phase 4 partial; full merge later) |

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
