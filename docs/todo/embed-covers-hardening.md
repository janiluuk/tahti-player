# Embed covers hardening

**Status:** open  
**Updated:** 2026-11-10  
**Follows:** library-sounds-embeds + embed-thumbnails (HISTORY 2026-11-10)

Close the gaps left after Embeds-under-Sounds and the first cover pass:
provider-accurate backfill beyond hearthis, persist client soft-fills,
hearthis soft-fill when `embedSourceUrl` exists, caching, and coverage.

## Next 30 slices

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | org | Covers backfill: Mixcloud provider artwork before presets | Embeds with Mixcloud `embedSourceUrl` / uri get CDN cover |
| 2 | org | Covers backfill: Spotify provider artwork before presets | Spotify embeds get album art URL |
| 3 | org | Covers backfill: Bandcamp provider artwork before presets | Bandcamp embeds get cover when resolvable |
| 4 | org | Covers backfill: Mikseri provider artwork (or document skip) | Mikseri covered or explicitly deferred with reason |
| 5 | org | Cap provider lookups per backfill request + timeout | No hung / spammy runs; presets still fill the rest |
| 6 | org | Unit: backfill restores Mixcloud/Spotify cover when mocked | Tests without live provider calls |
| 7 | org | Expose `embedSourceUrl` on Sound list DTO / OpenAPI if missing | Client can soft-fill hearthis with a page URL |
| 8 | player | Soft-fill hearthis when `embedSourceUrl` is set (noembed or hearthis oembed) | Hearthis rows without `bannerUrl` get a thumb |
| 9 | player | After soft-fill success, `PATCH` sound `bannerUrl` once | Soft fill persists; next load skips network |
| 10 | player | Skip soft-fill PATCH when viewer cannot edit (public channel) | Listeners never write |
| 11 | player | Soft-fill SoundCloud panel rows with null `thumbnailUrl` | Panel cards never stay blank when oEmbed works |
| 12 | player | Persist SoundCloud oEmbed thumb via existing embeds API if needed | Re-open panel keeps art |
| 13 | player | SessionStorage (or IndexedDB) cache for soft-fill URLs | Survives reload without re-hitting noembed |
| 14 | player | Soft-fill concurrency limit (e.g. 2–3 in flight) | Embeds tab with many missing covers stays smooth |
| 15 | player | Soft-fill failure marking (null cache) per provider+uri | No retry storms on known-bad URLs |
| 16 | player | Storybook: Embeds tab row without banner soft-fills | Play asserts img src becomes non-seed |
| 17 | player | Unit: soft-fill + PATCH called once | Mock fetch + patch |
| 18 | player | Unit: hearthis soft-fill with `sourceUrl` | Cover path uses page URL |
| 19 | org | Optional worker job: nightly embed cover backfill | Ops can run without artist clicking the button |
| 20 | player | Surfaces covers-backfill result counts (provider vs preset) | Toast / strip distinguishes sources |
| 21 | player | Channel public Embeds: soft-fill only (no PATCH) | Public page still shows art when API banner null |
| 22 | player | Artist profile embeds section: same soft-fill path | Profile matches Library Embeds |
| 23 | player | Admin ChannelTracksPanel: soft-fill when `bannerUrl` null | Board view matches artist library |
| 24 | player | Finnish/en copy if new backfill toast strings appear | i18n keys, not hardcoded English |
| 25 | player | Document soft-fill + backfill in user-manual Embeds note | One short “covers” paragraph |
| 26 | player | E2E: Embeds row without banner gains artwork (mock noembed) | Mock app journey |
| 27 | org | Allowlist / document noembed dependency or replace with first-party oEmbed proxy | No silent third-party hard dep without a note |
| 28 | player | Prefer first-party `/api/.../oembed-thumb` if org adds proxy | Drop noembed when proxy lands |
| 29 | player | VIEW-CATALOG / Storybook Missing: no blank embed thumbs | Missing states noted or covered |
| 30 | player | Fold this todo when slices ship; strip INDEX | HISTORY + delete |

## Deferred

- iTunes / native desktop library embeds
- Provider rate-limit contracts beyond per-request caps
- Re-hosting provider images into MinIO (keep hotlink unless product asks)
