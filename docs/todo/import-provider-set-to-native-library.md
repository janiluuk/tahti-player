# Import a provider playlist/set into the native library

**Status:** open
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
