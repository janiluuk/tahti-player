# Batch 71 — UX / usability (20 slices)

**Status:** partial

**In progress:** Slices 1–5, 10, 14–16 shipped (#1054–#1060, #1071). Remaining without PR: 6–9, 11–13, 17–20 — keep shipping as small PRs then fold.

Sources: e2e journey leftovers (`E2E-JOURNEYS.md` colour fills + listener journey),
`NAVIGATION-GAPS.md` redirects, `MOCKS.md` thin spots, feature-swipe leftovers,
and Studio go-live / Library phone gaps. Usability first; no new API inventing.

| # | Slice | Size | PR |
| --- | --- | --- | --- |
| 1 | Dashboard redirects: connections → Artist Connections; api → Account API tokens | XS | #1054 |
| 2 | Dashboard redirects: discovery → Channel Discovery; internet-radio → Add-ons Radio | XS | #1054 |
| 3 | Collapse upload / moderators redirect hops to final routes | XS | #1054 |
| 4 | Channel design/profile deep links land on Channel Designer (not Artist default) | S | #1054 |
| 5 | Studio home quick-link tiles use theme-safe accent colours (e2e fill leftover) | S | #1055 |
| 6 | Track editor hero / waveform uses theme tokens (e2e track-view leftover) | S | |
| 7 | Music archive empty Upload opens `/library/upload` (not a second modal) | S | |
| 8 | After creating a Series show, Go Live preselects that series | S | |
| 9 | Go Live session subnav overflows Prep siblings under ~640px | S | |
| 10 | Mock `fetchTracksByTag` returns fixture tracks so tag chips work offline | XS | #1058 |
| 11 | Richer mock archive/releases/collections for a fresh artist | S | |
| 12 | Onboarding toast uses a short duration (not sticky forever) | XS | #1084 |
| 13 | Sticky notification Acknowledge stays dismissed in mock | S | |
| 14 | Messages empty thread pane uses EmptyState + Discover CTA | XS | #1059 |
| 15 | Studio home Distribution tile when the artist has releases | S | #1071 |
| 16 | Collections list newest-first | XS | #1060 |
| 17 | Listener e2e journey signs in as `listener@` (not localStorage-only) | S | |
| 18 | Stable mock Jam code + clear invalid/ended empty states | S | |
| 19 | Studio Upload stacks FilePicker above recordings at 390px | S | |
| 20 | Listener / signed-out Library empty copy (no upload-centric prompt) | XS | |

