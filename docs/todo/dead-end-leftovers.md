# Dead ends left after the 2026-10-19 sweep

**Status:** blocked

The user reported that Library › Upload › Import sources said "Needs setup" with no way
to set anything up, and asked to flag other dead ends like it. Batch 75 fixed the ones
that tahti-web can fix on its own (see HISTORY). These need someone else first.

## Blocked on ops (server credentials)

- **OAuth providers say "Not available yet"** until the API has their app credentials:
  `SOUNDCLOUD_`, `BANDCAMP_`, `MIXCLOUD_`, `GOOGLE_DRIVE_`, `MUSICBRAINZ_` +
  `CLIENT_ID` / `CLIENT_SECRET` (tahti-org `apps/api/src/config.ts`), set on the deploy
  host with `pnpm tahti-ops env set …` and a redeploy (`pnpm tahti-ops deploy stack`). Each needs an app registered with
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

## Waiting on another session's open PRs

- Governance board / elections / annual reports panels say "Could not load … Try again
  later." with no Retry. #1231, #1232 and #1234 (another session's PageEmpty sweep) edit
  those files; add Retry (as #1254 did for the association panel) after they land.

## Checked and fine

- `/sources/*` redirects to Settings › Plugin store with the Import group open (only
  Mixcloud search looped, fixed in #1207).
- Disabled buttons found by a crawl of every static route as a board artist were all
  explained in place (Go Live checklist, empty forms, unchanged settings).
