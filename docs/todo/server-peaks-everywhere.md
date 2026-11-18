# Server peaks everywhere (Yaniho + lists)

**Status:** partial  
**Updated:** 2026-11-18  
**Absorbs leftovers from:** `yaniho-channel-waveform-peaks.md` (deleted
2026-11-18), [yaniho-channel-pregenerate-peaks.md](yaniho-channel-pregenerate-peaks.md)

## Shipped (player)

- AmbientTrackRow no longer fetches audio to decode peaks (READY+null → empty bars)
- Owner moderator badge / hide-remove (slices 26–28)
- 2026-11-18 (0.0.411), slices 12–21 and 25: `@tahti-player/ui` `Waveform`
  has no decode path or loading pulse (`audioUrl`, `cacheKey` and
  `decodedPeaksCache` removed; app start clears the old
  `tahti.decodedPeaks.v1` key), so no channel, profile, Library, Studio,
  track page, player bar or queue waveform can fetch audio. Stories
  `Waveform/NoServerPeaks` and `AmbientTrackList/ServerPeaksStates`; mock
  `/channel/yaniho` catalog with one peaks gap; e2e
  `use-cases-waveforms.spec.ts`; contract and list → mapper → endpoint map
  in [`docs/DATA-FLOW.md`](../DATA-FLOW.md#waveform-peaks-contract).
  Slice 24 needs no string: a missing waveform is calm flat bars.
  Absorbed and deleted `yaniho-channel-waveform-peaks.md`.

Waveforms must never start work in the browser. Peaks are generated in
pre-processing and returned on every playable surface. Yaniho’s channel page
still shows loading bars when peaks are missing on READY sounds.

## Left

Org slices 1–11, 22, 23 (`../tahti-org`), the prod Yaniho backfill (5) and
the live verify (30). Every player slice is shipped.

## Next 30 slices (in order)

| # | Repo | Slice | Done when |
| - | ---- | ----- | --------- |
| 1 | org | Audit which list/detail DTOs omit `peaks` | Table of gaps vs channel/track/search |
| 2 | org | Ensure transcode job always enqueues peaks job | No READY without peaks attempt |
| 3 | org | Peaks job idempotent + retry on empty result | Failed peaks re-queue |
| 4 | org | Admin/script: backfill peaks for READY sounds with null peaks | Dry-run count + write mode |
| 5 | org | Run backfill for Yaniho channel sounds (prod) | Yaniho READY rows have peaks |
| 6 | org | Search results include `peaks` when present | Search DTO + OpenAPI |
| 7 | org | Discover / Tahti Selects rows include `peaks` | Already partial — close gaps |
| 8 | org | Radio “just played” / feed leftovers if any | No loading waveform |
| 9 | org | Collection / playlist track rows include `peaks` | Owner + public |
| 10 | org | Channel public catalog page payload includes `peaks` | `/api/v1/channels/:slug` tracks |
| 11 | org | OpenAPI + api-client regenerate for peaks fields | CI generate clean |
| 12 | player | Channel track rows never compute client peaks | Use server peaks only |
| 13 | player | Artist profile ambient rows use server peaks | Same |
| 14 | player | Library / Studio Sounds list uses server peaks | Same |
| 15 | player | Track page waveform uses server peaks; no fetch-audio fallback | Same |
| 16 | player | Player bar / queue mini-waveform if any | Same |
| 17 | player | Loading state only while `peaks === undefined` and status PROCESSING | READY+null → empty bars or default, not spinner forever |
| 18 | player | Storybook: channel row with peaks / without / processing | Plays assert |
| 19 | player | Mock fixtures: Yaniho-like catalog with peaks | Mock mode |
| 20 | player | e2e: channel page waveforms not stuck loading | Spec or journey note |
| 21 | both | Document peaks contract in DATA-FLOW / AGENT | One paragraph |
| 22 | org | Metrics: count READY sounds missing peaks | Admin or Prometheus |
| 23 | org | Cron: weekly peaks gap report / auto-backfill batch | Optional small job |
| 24 | player | i18n for “waveform unavailable” if we show a calm empty | en + fi |
| 25 | player | Remove dead client peak-generation helpers if unused | Dead code gone |
| 26 | player | Channel owner moderator hide-remove (org #1109 leftover) | No trash on owner row |
| 27 | player | Owner badge on Fans → Chat → Moderators | Distinct row |
| 28 | player | Tests for owner moderator row | Vitest |
| 29 | player | Storybook Fans Chat Moderators with owner | Play |
| 30 | both | Live verify Yaniho waveforms + Radio after deploy of #1110 | Notes in todo |

## Done when

Opening `/channel/yaniho` (and other catalogs) draws stored waveforms immediately
for READY tracks; missing peaks are a data problem fixed by backfill, not a
spinner. Channel owner cannot remove themselves in the moderators UI.
