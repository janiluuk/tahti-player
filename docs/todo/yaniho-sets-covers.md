# Yaniho DJ sets: findability and cover art

**Status:** open

Report (2026-11-26): Yaniho's imported DJ sets have no cover art and cannot be found. tahti-web part shipped in this PR (see HISTORY); what is left needs tahti-org changes or an owner/ops data change.

## Where the sets are (production, public API, 2026-11-26)

- 15 sound rows longer than 15 min on `GET /api/v1/u/yaniho/profile` → `tracks[]`, all `source: HEARTHIS_EMBED` (they play through the hearthis.at embed, not from Tahti storage).
- Collection `sets` ("Sets", 6 items, featured, cover `collections/janiluuk/sets/cover-ZMozxdai.png`): page `https://tahti.live/u/yaniho/c/sets`.
- Collection `yaniho-2026-sets` ("2026 sets", `itemCount` 7, 6 public items, cover from `img.hearthis.at`): page `https://tahti.live/u/yaniho/c/yaniho-2026-sets`.
- 8 sets are in no collection, only in the "Embeds" list under the Stage tab of the full artist page: Moody Electronica vol. 36, Nightriders vol. 44 / 45 / 47, Set of Groovy Schranzenegger Techno, Set of grungy 'n crunchy electronica, Set of melodic house & schranz, Afterhours set of Melodic Electronica & Techno.
- Both set collections have `type: CUSTOM`, `style: PLAYLIST`.

## Root causes

1. **Cards dropped the default artwork (fixed in tahti-web).** `@tahti-player/ui` `Card` always passed a cassette `placeholder` to `MediaArtwork`, which turns off the `MediaArtworkDefaultProvider` fallback. Collection covers on the profile are presigned for 1 hour (`X-Amz-Expires=3600`); once a page or snapshot outlives that, every card cover 403s and showed an empty cassette instead of the default artwork.
2. **"2026 sets" was not a DJ set (fixed in tahti-web).** `collectionKind` only matched names starting with "Set", so "2026 sets" sat in the Playlists grid instead of the DJ sets tab.
3. **Studio "DJ sets" filter shows 0 (data).** Studio → Collections buckets by `style` only; both set collections are `PLAYLIST`. The artist page guesses from the name, Studio does not.
4. **Link page set cover 403 (tahti-org).** `apps/api/src/lib/link-page.ts` builds `linkPage.sets[].coverUrl` from the raw `Collection.coverUrl` column and only falls back to `publicMediaUrl(coverKey)` (unsigned). `collections/` objects are private, so `yaniho-249276-9675121` returns 403 on `https://tahti.live/u/yaniho` (tahti-web now shows the default artwork there). For `sets` the link page shows preset `artwork-05.webp` while the profile shows the uploaded `coverKey` PNG.
5. **Imported sets without their own artwork (data).** Three set sounds have preset banners (`artwork-03`, `-05`, `-15`) although hearthis.at has artwork for them; the hearthis import did not copy it.

## Left to do

- [ ] Owner (Yaniho, in Studio, no ops needed): set style "DJ set" on `sets` and `yaniho-2026-sets` (`PATCH /api/me/collections/:slug` `{ "style": "DJ_SET_SERIES" }`), and add the 8 loose sets to `sets` or `yaniho-2026-sets`.
- [ ] tahti-org `apps/api/src/lib/link-page.ts`: resolve set covers like the profile does - `coverKey` first, presigned (`presignedGetUrl(coverKey, 3600)`), then `coverUrl`. Add a link-page test with a `coverKey` collection.
- [ ] tahti-org (decision): serve collection covers (`collections/*/cover-*`) from a public-read prefix like `sound/*/banner-*`, so cover URLs stop expiring after 1 hour in cached pages, OG images and RSS.
- [ ] tahti-org (optional): `2026 sets` reports `itemCount` 7 but lists 6 public items; `_count.items` counts a private or withdrawn sound. Count only items the public route returns.
- [ ] Ops (after review): re-fetch hearthis.at artwork for the three preset-banner sets (`cmsxkpd4u0007h67mzeu0dlbl`, `cmsxkpflq000bh67m59fobaha`, `cmt4xu6l40020oyp6kc1iglxl`), or let the owner pick covers in Studio.
