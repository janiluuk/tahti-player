# hearthis.at track or set → audio files → Tahti release (CLI)

**Status:** partial

Goal: one `tahti` CLI flow that takes a hearthis.at track or set URL, downloads
the audio files, uploads them as Tahti sounds and re-makes the release on Tahti
(title, artwork, track order, description, tags).

Shipped as `tahti hearthis release <set-or-track-url>` and `tahti sounds upload`
in `packages/tahti-cli` (no tahti-org change: it uses the existing set-tracks,
upload, release and `artwork/from-url` routes, plus hearthis.at's public API for
a single track).

- `src/commands/hearthis-release-meta.mjs`: source parsing, single-track catalog, release plan, sound metadata.
- `src/commands/hearthis-release.mjs`: download → upload → create → cover, state file, dry run.
- `src/sound-upload.mjs`: prepare / PUT / complete upload, shared by `import` and `sounds upload`.
- `src/commands/fixtures/`: recorded hearthis.at track and Set responses for tests.

## Plan

- [x] 1. Map a hearthis set/track to release metadata (title, cover, order, description, genre, release date; tags go on each sound, since releases have no tags).
- [x] 2. Download with the existing set downloader (`downloadHearthisSet` takes a prefetched `catalog`); single tracks through the same path.
- [x] 3. `tahti sounds upload` on the shared upload client.
- [x] 4. Upload each file as a sound, in Set order.
- [x] 5. Create the release with `tracksFromSounds`, set the cover from the hearthis.at artwork URL, print the Studio URL.
- [x] 6. `--dry-run` lists what would be created.
- [x] 7. Resume: `<out>/.tahti-release-<permalink>.json` skips uploaded sounds and never creates the release twice.
- [x] 8. Tests with recorded hearthis responses; README/help entry.

## Left to do

- [ ] Confirm the product decisions below (defaults picked conservatively).
- [ ] One live run against tahti.live with a real Set (dry run, then real), then fold into HISTORY.
- [ ] Per-track tags and descriptions for Set tracks: the Tahti set-tracks route does not return them (single tracks get them from hearthis.at directly). Either add them to `toSetTrackResult` in tahti-org or read the Set from hearthis.at's public API.

## Decisions to confirm

- Single track → a one-track release (type single), not only a sound.
- No hearthis.at embed is created; the tracks play the uploaded audio.
- An existing release with the same title (case-insensitive) stops the run before uploading; `--force-new` creates another one.
- Only tracks uploaded by the Set's owner are included; others are listed as left out.
- A chosen track that is not downloadable stops the run (use `--tracks` to leave it out) rather than making a shorter release silently.
- Type defaults: 1 track single, 2-6 EP, 7+ album. Release date: earliest track date.
- The release is created as a draft; publishing stays in Studio.
