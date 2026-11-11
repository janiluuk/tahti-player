# Embed covers hardening

**Status:** partial  
**Updated:** 2026-11-11 (slices 17, 18, 20, 24, 25, 29; only 19, an optional nightly worker job, is left)  
**Follows:** library-sounds-embeds + embed-thumbnails (HISTORY 2026-11-10)

Close the gaps left after Embeds-under-Sounds and the first cover pass:
provider-accurate backfill beyond hearthis, persist client soft-fills,
hearthis soft-fill when `embedSourceUrl` exists, caching, and coverage.

## Shipped (2026-11-11, slices 1–10 landed)

- 1–4: tahti-org #1093. The backfill asks Mixcloud (API pictures), Spotify (public oEmbed) and Bandcamp (`og:image` from an https `*.bandcamp.com` URL; no Bandcamp enum exists) before presets. Mikseri is skipped on purpose because its embed page has no artwork and no public cover endpoint exists.
- 5–6: tahti-org #1098. At most 25 lookups, 5 s each, 20 s total; rows past the cap get presets. The route test stubs `fetch` for Mixcloud and Spotify. The same commits were #1094 and #1095, which still target the already-merged cover branches because that repo rejects force-push.
- 7: tahti-org #1096. `SoundViewSchema` names `bannerUrl`/`embed*`. `embedProvider` stays a string because a nullable enum in the list's `anyOf` union made Fastify answer 500.
- 8 (+18): tahti-player #1998. Hearthis soft-fill reads `api-v2.hearthis.at/<user>/<track>/` artwork (noembed has no hearthis provider).
- 9 (+17): tahti-player #1999. `EmbedTrackRow onSoftArtwork` → `persistSoftCover` PATCHes `bannerUrl` once per sound per session (Library → Embeds, Sounds embed cards).
- 10: tahti-player #2000 (on #1999). No write when signed out, without a channel, or before the profile loads.

- 23, 27, 28: tahti-org #1099 adds `GET /api/v1/embeds/thumbnail?url=` (SoundCloud and YouTube oEmbed, the backfill's lookups for hearthis, Mixcloud, Spotify and Bandcamp; 6 h cache, 120/min per IP). `lib/embedThumbnail.ts` calls it instead of noembed and the hearthis API; mock mode answers with a bundled cover. The admin channel tracks panel soft-fills rows with no `bannerUrl` and never writes.

Note: the backfill only sees rows with `bannerUrl: null`, but every embed import calls `assignPresetCovers` right after create. Embeds imported that way already hold a preset and never get provider art from the backfill. Whether to replace presets with provider art (by matching against the preset URLs) is a product call.

## Next 30 slices

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | org | Covers backfill: Mixcloud provider artwork before presets | Embeds with Mixcloud `embedSourceUrl` / uri get CDN cover |
| 2 | org | Covers backfill: Spotify provider artwork before presets | Spotify embeds get album art URL |
| 3 | org | Covers backfill: Bandcamp provider artwork before presets | Bandcamp embeds get cover when resolvable |
| 4 | org | Covers backfill: Mikseri provider artwork (or document skip) | Mikseri covered or explicitly deferred with reason |
| 5 | org | Cap provider lookups per backfill request + timeout | Done: #1098, 25 lookups, 5 s each, 20 s total |
| 6 | org | Unit: backfill restores Mixcloud/Spotify cover when mocked | Done: #1098 route test with stubbed `fetch` |
| 7 | org | Expose `embedSourceUrl` on Sound list DTO / OpenAPI if missing | Client can soft-fill hearthis with a page URL |
| 8 | player | Soft-fill hearthis when `embedSourceUrl` is set (noembed or hearthis oembed) | Hearthis rows without `bannerUrl` get a thumb |
| 9 | player | After soft-fill success, `PATCH` sound `bannerUrl` once | Soft fill persists; next load skips network |
| 10 | player | Skip soft-fill PATCH when viewer cannot edit (public channel) | Listeners never write |
| 11 | player | Soft-fill SoundCloud panel rows with null `thumbnailUrl` | Done: `SoftMediaArtwork` asks noembed when `thumbnailUrl` is null |
| 12 | player | Persist SoundCloud oEmbed thumb via embeds API | Done: `PATCH /api/me/embeds/:id` `{ thumbnailUrl }` and `persistEmbedThumbnail` once per id |
| 13 | player | SessionStorage (or IndexedDB) cache for soft-fill URLs | Done: `sessionStorage` key `tahti-web:embed-thumb:` |
| 14 | player | Soft-fill concurrency limit (e.g. 2–3 in flight) | Done: at most 3 lookups in flight |
| 15 | player | Soft-fill failure marking (null cache) per provider+uri | Done: empty session value means a known miss |
| 16 | player | Storybook: Embeds tab row without banner soft-fills | Done: `EmbedSoftFill` play asserts the mock proxy cover |
| 17 | player | Unit: soft-fill + PATCH called once | Done: `persistSoftCover.test.ts` (one PATCH per sound) |
| 18 | player | Unit: hearthis soft-fill with `sourceUrl` | Done: `embedThumbnail.test.ts` sends the page URL to the proxy |
| 19 | org | Optional worker job: nightly embed cover backfill | Ops can run without artist clicking the button |
| 20 | player | Surfaces covers-backfill result counts (provider vs preset) | Done: tahti-org #1100 `fromProvider` / `fromPresets`; the toast description splits them |
| 21 | player | Channel public Embeds: soft-fill only (no PATCH) | Done: SoundCloud panel uses soft-fill and does not write |
| 22 | player | Artist profile embeds section: same soft-fill path | Done: `ArtistSoundCloudTracks` uses the same soft-fill |
| 23 | player | Admin ChannelTracksPanel: soft-fill when `bannerUrl` null | Done: soft-fill only, no PATCH |
| 24 | player | Finnish/en copy if new backfill toast strings appear | Done: `library.coversBackfill*` in en and fi |
| 25 | player | Document soft-fill + backfill in user-manual Embeds note | Done: Uploads and tracks → Covers for embeds |
| 26 | player | E2E: Embeds row without banner gains artwork (mock noembed) | Done: mock Mixcloud row with no banner gets the mock proxy cover |
| 27 | org | Allowlist / document noembed dependency or replace with first-party oEmbed proxy | Done: #1099 first-party proxy |
| 28 | player | Prefer first-party `/api/.../oembed-thumb` if org adds proxy | Done: noembed dropped |
| 29 | player | VIEW-CATALOG / Storybook Missing: no blank embed thumbs | Done: Library Embeds row points at the EmbedSoftFill story |
| 30 | player | Fold this todo when slices ship; strip INDEX | HISTORY + delete |

## Deferred

- iTunes / native desktop library embeds
- Provider rate-limit contracts beyond per-request caps
- Re-hosting provider images into MinIO (keep hotlink unless product asks)
