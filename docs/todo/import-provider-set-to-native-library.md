# Import a provider playlist/set into the native library

**Status:** partial
**Added:** 2026-09-18
**Goal:** Let a desktop user choose a playlist or set from an import provider such as hearthis.at or SoundCloud, download every eligible track, and add each completed download as a durable native-library track.

## Product contract

- Start from Settings → Add-ons → Import and reuse the configured import-provider account/session rather than creating a separate provider connection.
- Accept a provider playlist/set URL or a set returned by provider browsing. Resolve its ordered entries and show a review step with track count, titles, availability and destination before downloading.
- Download only tracks the provider explicitly exposes as downloadable for the connected user. Do not rip iframe/embed playback streams or bypass provider permissions, authentication, rate limits or terms.
- Import each successful download through the same native catalog path as local file/folder import. A completed item becomes a normal durable native audio track with extracted metadata, stable local identity, playback/queue support and provider provenance.
- Keep the original playlist/set ordering and enough provider identity to retry idempotently. Re-running the same import must not create duplicate native tracks when the provider item and downloaded file are unchanged.
- Show overall and per-track progress, queued/downloading/imported/skipped/failed states, cancellation, retry, and actionable errors. One failed item must not abort the rest of the set.
- Make destination, filename collision behavior and disk-space requirements explicit. Partial downloads must not appear as playable catalog entries and must be cleaned up or safely resumed.
- Preserve the existing embed-only path as a separate user choice. “Add embed” references provider-hosted playback; “Download to desktop library” creates a local native track.

## Implementation gates

- Inspect each provider plugin and its actual API/download contract before defining DTOs. SoundCloud may require OAuth and may expose downloads only for the user’s own downloadable tracks; hearthis.at set enumeration and media-download authorization need separate verification.
- Define a provider-neutral manifest shape for playlist identity, ordered entry identity, metadata, artwork and an authorized download request without leaking provider tokens into persisted frontend state.
- Implement downloads in the Tauri/native layer with bounded concurrency, atomic temporary files, cancellation and progress events. Hand completed paths to the native library importer; do not fetch large audio bodies through the WebView.
- Record provider, remote item ID, source set ID and import timestamp in the native catalog so duplicate detection and retry do not depend on filenames.
- Add deterministic provider fixtures and tests for pagination, ordering, duplicate entries, unavailable/non-downloadable items, expired authorization, cancellation, retry, partial failure, filename collisions and restart/resume.
- If this changes a Tahti Player plugin, follow the plugin and marketplace registry checklists. Do not invent sibling API work; use it only if a verified contract is actually required.

## Exit demo

Choose a multi-track hearthis.at or SoundCloud set, review it, download the eligible entries with visible progress, survive one failed item, and see every completed item in Local files as a native track that still plays after an offline restart. Re-running the import skips unchanged tracks and retrying completes only the failures.

## Progress (2026-09-25)

**hearthis.at: done** (user chose hearthis.at only for this pass).

- Native import now also reads MP3, AIFF, M4A and OGG (Symphonia `mp3`/`aiff`/`isomp4`/`aac`/`ogg`/`vorbis`; one `SUPPORTED_AUDIO_EXTENSIONS` list for the import check, metadata reader and pickers; MP3 length falls back to lofty when the header has no frame count). Tag write-back stays FLAC/WAV.
- `local_library/provider_import.rs`: `library_provider_import` downloads the set's downloadable entries (3 at a time, hidden `.part` file renamed when complete, removed on failure or cancel), imports each file through `import_paths`, and records it in the new `library_track_sources` table (migration `0013`). A re-run skips `(provider, remote_id)` pairs whose file is still there; the named playlist is created or re-synced to set order. Catalog writes are serialised (parallel SQLite import transactions deadlocked). `library_provider_import_cancel`, `library_provider_import_destination` (`<Music>/Tahti/hearthis.at/<set>`). 8 Rust tests against a local axum server.
- Web: `api/sources/hearthis.ts` maps `downloadable`/`download_url`/`download_filename` (verified against the live API: set listings carry them, links redirect to a public MP3) and parses pasted set links. Local files gets an "Import hearthis.at set" button (desktop builds with `providerImport`), opening `HearthisSetImportDialog`: paste a link or pick one of your sets, review (stream-only tracks marked, folder shown, playlist on/off), per-track progress, cancel, retry of failures. Tests and a Storybook story.

## Still open

- **SoundCloud.** Needs `../tahti-org` work first: an endpoint listing the user's playlists/sets with per-track `downloadable`, and one handing the desktop app an authorised download (the OAuth token stays on the server). Then add `soundcloud` to `PROVIDERS` in `provider_import.rs` and a second picker.
- **Not yet run in the desktop app** against a real hearthis.at set (checked with Rust tests, web tests and Storybook). Also check then whether real hearthis.at download links answer HEAD with a `Content-Length`; if not, the disk-space line (#176) shows the sizes as unknown.
