# Listener stats: full origin / referrer URL

**Status:** partial  
**Updated:** 2026-11-18  
**Sibling:** `../tahti-org/docs/todo/listener-stats-origin-url.md` (API)

## Shipped (player)

- Heartbeat client sends `referrerUrl` (+ host)
- Channel moderators: owner badge, no Remove (slices 26–28)
- `StatsAudienceDimension` includes `referrerUrl` for later UI

Studio listener stats (and track insights / audience panels) should show the
**full origin URL** listeners were referred from, not only the referrer host.

Today tahti-org stores only `referrerHost` on listen sessions
(`listen-heartbeat` → `normalizeReferrerHost`). Artists cannot see the
concrete page or campaign URL that sent the listen.

## Next 30 slices (in order)

Stack org → player. Privacy: strip fragments and credentials; truncate length;
keep folding rare values into Other.

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | org | Prisma `ListenSession.referrerUrl` (nullable string) + migration | Column exists; host column kept |
| 2 | org | `normalizeReferrerUrl` (strip fragment/userinfo, max length, reject junk) | Unit tests for good/bad URLs |
| 3 | org | Shared Zod: optional `referrerUrl` on heartbeat body | `@tahti/shared` schema |
| 4 | org | Heartbeat persists `referrerUrl` (+ still set host from it) | Session row has both fields |
| 5 | org | Heartbeat tests: sanitize, host derived, oversize truncated | Vitest green |
| 6 | org | Privacy / data-export includes `referrerUrl` | Export JSON has the field |
| 7 | org | Audience `source` dimension can group by URL (`groupBy=referrerUrl`) | API returns URL buckets |
| 8 | org | Default audience source stays host; document URL mode | OpenAPI + route docs |
| 9 | org | Fold URLs under `minBucket` into Other (same as host) | Rare paths not listed alone |
| 10 | org | Track / sound insights sources expose URL when requested | Insights payload includes it |
| 11 | org | OpenAPI + regenerate `@tahti/api-client` for audience/heartbeat | Paths regenerate clean |
| 12 | org | Migration note: historical rows keep host-only (no backfill) | Docs / comment in todo |
| 13 | player | Heartbeat client sends sanitized `document.referrer` as `referrerUrl` | Network payload has URL |
| 14 | player | Keep sending `referrerHost` for older APIs / dual-write period | Host still present |
| 15 | player | `ReferrerSources`: optional URL mode / toggle or second list | UI can show paths |
| 16 | player | Truncate long URLs in the list; full URL in tooltip | Readable rows |
| 17 | player | External-link affordance when URL is absolute http(s) | Opens in new tab |
| 18 | player | Stats Audience fetch with URL groupBy when UI asks | Client wired |
| 19 | player | Track insights / Plays panel shows origin URLs | Per-track surface |
| 20 | player | Mock fixtures for URL buckets (Direct / path / Other) | Mock mode works |
| 21 | player | Storybook `ReferrerSources` with URL rows + Other | Play asserts labels |
| 22 | player | i18n for URL mode copy (en + fi) | Keys exist |
| 23 | player | Unit tests for URL truncate / label helpers | Vitest green |
| 24 | player | e2e or journey sketch: Stats → sources shows a path | Spec or documented skip |
| 25 | both | Fold host-only “Other sites” copy vs “Other pages” for URL mode | Clear wording |
| 26 | player | Channel moderators: no Remove on the owner row (after tahti-org#1109) | Owner has no trash control |
| 27 | player | Owner row badge / copy (“You · owner”) on moderators list | Distinct from delegated mods |
| 28 | player | `ChannelModeratorsPanel` tests: owner listed, remove hidden | Vitest green |
| 29 | player | Storybook Fans Chat → Moderators shows owner without remove | Play asserts |
| 30 | both | Live verify: owner auto-mod + one real referrer URL on beta | Notes in live-verify / this file |

## Done when

Artists can see where listens came from as URLs (or path+host), not only the
referring domain, and the channel owner appears as a non-removable moderator.
