# hearthis.at track or set → audio files → Tahti release (CLI)

**Status:** open

Goal: one `tahti` CLI flow that takes a hearthis.at track or set URL, downloads
the audio files, uploads them as Tahti sounds and re-makes the release on Tahti
(title, artwork, track order, description, tags).

Existing pieces in `packages/tahti-cli/src/commands/` to chain, not rewrite:

- `hearthis-set.mjs`, `hearthis-user-sets.mjs`, `hearthis-download-set.mjs`, `hearthis-paths.mjs`: read a set and download its audio.
- `library-download.mjs`: downloads into the library folder.
- `releases-create.mjs` (`tracksFromSounds`), `releases-add-tracks.mjs`, `releases-show.mjs`: create a release and attach sounds.

Open questions (product):

- Single track → a one-track release (single), or only a sound?
- Keep the hearthis.at embed on the new tracks, or replace it with the uploaded audio?
- What to do when the artist already has a release with the same title (skip, update, new)?

Plan:

1. Map a hearthis set/track to release metadata (title, cover, order, description, tags, release date).
2. Download with the existing set downloader; single tracks through the same path.
3. Upload each file as a sound, keep order. The CLI has no sound upload command yet; add one on the API client.
4. Create the release with `tracksFromSounds`, set the cover, print the release URL.
5. `--dry-run` lists what would be created; resume skips files already uploaded.
6. Tests with recorded hearthis responses; README/help entry.
