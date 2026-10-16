# Feature swipe — implemented but unused / undocumented

**Status:** open

Audit of tahti-web routes/views that exist in code but are hard to reach from
chrome, or are missing from the end-user guide (`packages/docs` GitBook and/or
in-app `/help`). Cross-checked against `docs/VIEW-CATALOG.md`,
`packages/tahti-web/NAVIGATION-GAPS.md`, `packages/docs/SUMMARY.md`,
`AppShell` / `StudioNav` / `AdminNav` / `MobileChrome`, and `content/help.ts`.

Do not invent API. Prefer small PRs per gap. Leave large/unclear items here.

## Already intentional (do not “fix”)

| Surface | Why it is OK |
| --- | --- |
| Member `/governance` | Settings → Account only (by design; artists have Studio → Governance) |
| Admin hub redirects (`/admin/beta`, support, reports, grants, AGM, files, activity, disco-widgets, …) | Folded into Moderation / Governance / Storage / Logs / Add-ons |
| Old Studio paths (`/studio/sounds`, stash, upload, archive, revenue, moderation, …) | Redirects into Library / Settings / Audience |
| `/admin/map`, `/more` | Diagnostics / atlas by design |
| Desktop player routes in VIEW-CATALOG | Separate app; not tahti-web chrome |

## Reachability gaps (UI)

| Gap | Evidence | Suggested fix | Size |
| --- | --- | --- | --- |
| Public `/schedule` not linked from Radio | `NAVIGATION-GAPS.md`; Radio header has Book slot + channel only | Add “Full schedule” (or calendar) link on `RadioView` to `/schedule` | Easy — ship in focused PR |
| `/studio/distribution` only from Releases row / export add-ons | No StudioNav item | Product call: keep deep-link-only, or add under Releases submenu | Flagged — unclear |
| `/chat` hub has no chrome entry | Only channel stage → `/chat/$slug` | Product call: keep channel-scoped, or add Messages-adjacent entry | Flagged — unclear |
| Shared listening Jam undocumented in `/help` | Start Jam on collection works; help has no Jam article | Add Help article + listener guide mention | Easy — ship in focused PR |
| Mobile bottom nav omits Favorites / Library / Help | Favorites/Library/Help live in “More” drawer | Product call whether primary bar should grow | Flagged — product |

## Documentation gaps

| Gap | Where users look today | Suggested fix | Size |
| --- | --- | --- | --- |
| GitBook (`packages/docs`) is desktop-player-centric | User Manual + Discover misc page; almost no Listen / Radio / Studio / Admin web guide | Add a short “Tahti Live (web)” user-manual page that points at in-app Help and names main chrome | Easy — ship in focused PR |
| Shared Jam (web `/jam/$code`) vs desktop “Tahti Jam” remote | `user-manual/remote-control.md` is desktop remote only | Clarify naming in GitBook + Help so shared listening ≠ phone remote | Easy with Jam help |
| Studio Broadcast / Audience / Library tabs | Covered somewhat in Help artist guide; not in GitBook | Leave to in-app Help unless GitBook web section expands | Flagged |
| Admin surfaces | In-app `admin-guide` Help only | OK for board; no GitBook need unless requested | Flagged |

## Icon / chrome consistency

Tracked separately in the tab-icons swipe PR (Listen used a dashboard
`GaugeIcon`; Studio Posts/Broadcast siblings reused `TrendingUp`/`Radio`;
Admin News/Storage/Add-ons/Vendors/Selects collided). Not duplicated here
once that PR merges — leave a one-liner in HISTORY when folding.

## Out of scope / larger

- Channel page visual redesign (`docs/todo/channel-page-redesign.md`, `ui-nav-audit.md`)
- Listening party (`docs/todo/listening-party.md`) — needs API
- Atlas runtime wiring (`atlas-navigation-structure-widget.md`)
- Inventing nav for every redirect alias

## Done this swipe (link PRs when merged)

- [ ] Todo + INDEX (this file)
- [ ] Tab icons PR
- [ ] Radio → `/schedule` + Jam Help + GitBook web stub PR
