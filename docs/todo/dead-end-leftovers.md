# Dead ends left after the 2026-10-19 sweep

**Status:** blocked

The user reported that Library › Upload › Import sources said "Needs setup" with no way
to set anything up, and asked to flag other dead ends like it. Batch 75 fixed the ones
that tahti-web can fix on its own (see HISTORY). These need someone else first.

## Blocked on ops (server credentials)

- **OAuth providers say "Not available yet"** until the API has their app credentials:
  `SOUNDCLOUD_`, `BANDCAMP_`, `MIXCLOUD_`, `GOOGLE_DRIVE_`, `MUSICBRAINZ_` +
  `CLIENT_ID` / `CLIENT_SECRET` (tahti-org `apps/api/src/config.ts`), set on the deploy
  host with `scripts/stack-env.sh set` and a redeploy. Each needs an app registered with
  the provider and the redirect URL `<API>/api/me/<provider>/oauth/callback`. The setup
  dialog now shows board members these steps. Storing them from an admin page instead of
  env would be a tahti-org change (needs go-ahead).

## Blocked on tahti-org / provider APIs

- **Bandcamp:** connects, but album import is off until Bandcamp approves API v1
  (`import: false`). Hidden on the upload page; the Plugin store card says so.
- **Google Drive:** connects, but the Google Picker file chooser was never built, so
  there is nothing to import. Hidden on the upload page; the card points to Upload.
- **Delete a release:** no `DELETE` release route in tahti-org (see
  `studio-artist-usability.md`).

## Found in batch 77

- **Meeting conflicts never load:** `MeetingConflicts` calls
  `GET /api/v1/governance/meetings/:id/conflicts`, which tahti-org doesn't have (only the
  admin route exists), so the panel is always hidden. Needs a member route in tahti-org.
- **~100 fetchers label real API failures as `source: 'mock'`** (`failMeta(err)` with
  empty data and no mock fallback, e.g. `fetchMyEvents`, `fetchAdminUsers`,
  `fetchStatsTopTracks`). Views that check `meta.source === 'api'` can't tell those
  failures from empty data. Switching them to `apiErrorMeta` needs a check of the few
  callers that read `source === 'mock'` (`SubscribeView`, `ChannelChatPanel`,
  `BroadcastRecordingToggles`, `libraryStore`, `useMultitrackSession`).

## Left after batch 76 (failed loads still shown as empty)

Low-impact or owned by another session's open work; same `meta.reason` → `PageError` fix:

- `useStudioHome` (motions / feature requests / broadcasts), `PlayableTrackContextMenu`,
  `ChannelPlaylistPicker`, `CollectionOrderButton`, `HearthisCard`, `StashFilesPanel`
  collections and sounds, `ReleaseOpsPanel` royalties, `RecordedAtVenuePicker`.
- `MeetingAgendaItems` falls back to the legacy agenda on any failure (keep the fallback for
  servers without the route; only show an error for non-404 failures).
- `RadioShowView` now-playing / upcoming (polled; hides on failure), `ArtistLikes` and
  `SubscribedCollections` (hidden on failure), `DeliveryTab` platform modes.
- `show-detail/useShowDetail.ts` episodes and bookings — another session's batch 4 edits
  `EpisodesTab` / `OverviewTab`.
- `ArtistPanel` social connections and `NotificationsVisibilityPanel` (profile toggles show
  off on failure).
- `StudioCollectionsView` row Play says "Nothing in this collection can play yet" when the
  fetch failed; stream manager "Apply to rotation" refetch says "no tracks" (it aborts, so
  no data loss).

## Checked and fine

- `/sources/*` redirects to Settings › Plugin store with the Import group open (only
  Mixcloud search looped, fixed in #1207).
- Disabled buttons found by a crawl of every static route as a board artist were all
  explained in place (Go Live checklist, empty forms, unchanged settings).
