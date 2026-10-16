# @tahti-player/tahti-cli

Terminal-first CLI for Tahti — thin, scriptable access to the public Tahti
API, in the spirit of [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli).

**Standalone docs + cheatsheet:**
[janiluuk/tahti-cli](https://github.com/janiluuk/tahti-cli) (shell key map,
related repos). This package is the monorepo copy used in day-to-day player
development; see [`docs/todo/tahti-cli-tool.md`](../../docs/todo/tahti-cli-tool.md).

## Scope

Read-only commands, plus `import` (folder upload) and `shell` (interactive
TUI with mpv playback). Capability catalogs used by Tahti Player
(`GET /api/me/import-plugins`, `GET /api/me/export-plugins`) are **not** CLI
commands yet — call them with `curl`/`fetch` against the same API if you need
registry discovery from scripts.

### Interactive shell (`tahti shell`)

Opens a blessed TUI: Library · Search · Likes · Radio · Queue · History (this session, newest first). Playback is delegated
to an external **mpv** process (must be on `PATH`). Needs a TTY and
`TAHTI_API_TOKEN` for library audio (`GET /api/me/sound/:id/editor/source`).

```bash
# Install mpv on the host first (apt/brew/etc.), then:
pnpm --filter @tahti-player/tahti-cli exec tahti shell
```

Keys: `Tab` focus nav/list, `Enter` play, `Space` pause, `n`/`p` next/prev (`p` restarts after 3 s),
`←`/`→` seek ±5s, `/` search, `a` add to queue, `c` clear queue, `?` help,
`q` quit. Radio loads Tahti Radio HLS plus public internet-radio presets.
Search results list titles but usually have no stream URL — play those from
the Library when you own them.

### hearthis.at discography

List Sets, inspect tracks, then download downloadable originals into a neat
folder tree. Requires `TAHTI_API_TOKEN` and a hearthis.at handle on your Tahti
profile (Settings → Profile). Downloads use hearthis.at `download_url`
(original upload — often WAV/FLAC), never the compressed stream preview.

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis sets
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis set 378936-9675121
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 378936-9675121 --dry-run
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 378936-9675121 --out ~/Music/hearthis
```

Layout: `Artist/Album (year)/01 - Track.ext`

## Auth

Tahti's API already has a personal API token mechanism
(`Authorization: Bearer tahti_...`, read/write scopes) — this CLI uses that
directly rather than inventing a new auth flow. It does **not** talk to
`../tahti-org`'s generated `@tahti/api-client` package: that package is
`private: true` and lives in a separate repo/pnpm workspace, so it isn't
importable from here without publishing it or vendoring its types — this
CLI instead makes plain `fetch` calls against the public HTTP API, the same
approach `packages/tahti-web` itself uses (it doesn't consume
`@tahti/api-client` either, despite the roadmap doc's original assumption
that it did).

1. Sign in at [tahti.live](https://tahti.live) → Settings → Account → API
   tokens → create a token.
2. Run `tahti login` and paste it (or pipe it in: `pass tahti | tahti login`).
   It is checked, then saved to `$XDG_CONFIG_HOME/tahti/config.json`
   (`~/.config/tahti/config.json`), readable only by you. `tahti logout`
   deletes that file. Alternatively `export TAHTI_API_TOKEN=tahti_...`, which
   wins over the saved token.
3. Optionally `export TAHTI_API_URL=https://api.tahti.live` (this is
   already the default).

## Usage

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti --help
pnpm --filter @tahti-player/tahti-cli exec tahti whoami
pnpm --filter @tahti-player/tahti-cli exec tahti library list --sort title
pnpm --filter @tahti-player/tahti-cli exec tahti library show <id> --json
pnpm --filter @tahti-player/tahti-cli exec tahti releases list --limit 20
pnpm --filter @tahti-player/tahti-cli exec tahti releases list --help
pnpm --filter @tahti-player/tahti-cli exec tahti releases show <id>
pnpm --filter @tahti-player/tahti-cli exec tahti search night drive --limit 10
```

## Commands

Every command accepts `--json` (prints the API response unchanged) and
`--help`. Tables use the same aligned layout, with `-` for empty values.

| Command                                                                                       | API route                                                                     | Output                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tahti whoami [--json]`                                                                       | `GET /api/auth/me`                                                            | Username, display name, tier, membership, channel slug, storage used                                                                                                                          |
| `tahti login [--token <token>]` / `tahti logout` | `GET /api/auth/me` | Checks the token and saves it to `~/.config/tahti/config.json` (mode 600), or deletes that file; `TAHTI_API_TOKEN` still wins when set |
| `tahti library list [--sort <order>] [--json]`                                                | `GET /api/me/sound`                                                           | Your library sounds (up to 100); `--sort` is one of `newest`, `oldest`, `title`, `duration`, `bpm`, `genre`                                                                                   |
| `tahti library show <id> [--json]`                                                            | `GET /api/me/sound/:id`                                                       | One sound's metadata (status, duration, visibility, genre, BPM/key, source format, dates)                                                                                                     |
| `tahti library edit <id> [--title] [--description] [--genre] [--tags] [--bpm] [--key] [--public \| --private] [--downloads on\|off] [--json]` | `PATCH /api/me/sound/:id` | Changes only the given fields and prints the sound as saved; `""` or `none` clears a field; needs the `write` scope |
| `tahti library delete <id> --yes` | `GET /api/me/sound/:id`, `DELETE /api/me/sound/:id` | Deletes the sound and all its versions; without `--yes` it names the sound and stops; needs the `write` scope |
| `tahti library download <id> [--out <dir>] [--force] [--url] [--json]` | `GET /api/me/sound/:id/download` + the signed storage link | Saves the original upload (else FLAC, else MP3) under the API's file name; `--url` prints the hour-long signed link instead |
| `tahti library processing [--wait] [--timeout <s>] [--json]` | `GET /api/me/sound/processing` | Sounds still `PENDING` or `PROCESSING` (id, status, title); `--wait` checks every 5 s until none are left and exits 1 after `--timeout` (default 600 s) |
| `tahti releases list [--page <n>] [--limit <n>] [--json]`                                     | `GET /api/me/releases`                                                        | Your releases (id, title, type, state, release date, track count); `--limit` is 1-100                                                                                                         |
| `tahti releases show <id> [--json]`                                                           | `GET /api/me/releases/:id`                                                    | One release (type, state, release date, genre, UPC, label, smart link and its views, catalog checklist) plus its tracklist (position, title, duration, status, ISRC)                          |
| `tahti releases create <title> [--type <t>] [--date <YYYY-MM-DD>] [--description <t>] [--genre <g>] [--sound <id>...] [--json]` | `GET /api/me/sound/:id` per `--sound`, `POST /api/me/releases` | Creates a draft release (default: a single released today); each `--sound` becomes a track titled after the sound; needs the `write` scope |
| `tahti releases edit <id> [--state draft\|published\|archived] [--description <t>] [--date <YYYY-MM-DD>] [--pin \| --unpin] [--footer on\|off] [--link <service>=<url>...] [--json]` | `PATCH /api/me/releases/:id` (plus `GET /api/me/releases/:id` for `--link`) | Changes only the given fields and prints the release as saved; `--link` merges onto the existing store links (an empty URL removes one); publishing needs a track; needs the `write` scope |
| `tahti releases add-tracks <id> --sound <id>... [--json]` | `GET /api/me/releases/:id`, `GET /api/me/sound/:id` per `--sound`, `POST /api/me/releases/:id/tracks` per sound | Adds library sounds as tracks after the existing ones, in the order given, titled after the sound; prints the new tracklist (`--json`: the added tracks); needs the `write` scope |
| `tahti search <query> [--page <n>] [--limit <n>] [--json]`                                    | `GET /api/v1/search/tracks`                                                   | Public, ready tracks whose title matches (id, title, artist, duration, channel), newest first                                                                                                 |
| `tahti import <folder> [--recursive] [--dry-run] [--force] [--ignore-tags] [--json]`                          | `POST /api/uploads/prepare`, storage `PUT`, `POST /api/uploads/complete`      | One row per audio file: uploaded (with the new sound id), skipped, or failed with the reason                                                                                                  |
| `tahti notifications list [--limit <n>] [--unread] [--json]`                                  | `GET /api/me/notifications`                                                   | Your notifications, newest first (id, unread mark, date, type, sender, title) and the unread total; `--limit` is 1-50                                                                         |
| `tahti notifications read <id> \| --all`                                                      | `PATCH /api/me/notifications/:id/read`, `POST /api/me/notifications/read-all` | Marks one notification read, or every non-sticky one with `--all`; needs the `write` scope                                                                                                    |
| `tahti stats [--range <days>] [--json]`                                                       | `GET /api/me/stats/summary`, `GET /api/me/stats/top-tracks`                   | Plays and downloads today and in total, followers, and the ten most played tracks; `--range` is `1`, `7`, `30` or `all` (default)                                                             |
| `tahti purchases [--json]` | `GET /api/me/purchases` | Paid purchases, newest first (date, artist, tier, amount in euros, tracks it unlocked) |
| `tahti blocks list [--json]` | `GET /api/me/blocks` | Accounts you have blocked (username, name, date) |
| `tahti blocks add <username>` / `tahti blocks remove <username>` | `POST /api/me/blocks`, `DELETE /api/me/blocks/:username` | Blocks or unblocks; a block also removes follows, loves, reposts and subscriptions between you, and unblocking does not restore them; needs the `write` scope |
| `tahti mentions [--limit <n>] [--json]` | `GET /api/me/mentions` | Where other artists @mentioned you, newest first (date, who, bio/announcement/release/newsletter/tracklist/chat, title or link); `--limit` is 1-50 |
| `tahti messages list [--json]` | `GET /api/me/messages/conversations` | Conversations (who, unread, updated, start of the last message) and the unread total; does not mark anything read |
| `tahti messages send <username> <message...>` | `POST /api/me/messages/conversations`, `POST /api/me/messages/conversations/:id/messages` | Sends one message, starting the conversation if needed; needs the `write` scope |
| `tahti feed [--limit <n>] [--json]` | `GET /api/me/feed` | Recent posts, tracks and releases from artists you follow (date, artist, kind, title or start of the post) |
| `tahti likes [--limit <n>] [--json]` | `GET /api/me/likes` | Tracks you loved, newest first (date, artist, title, id); `--limit` is 1-100 (default 50) |
| `tahti stash list [--page <n>] [--limit <n>] [--json]` | `GET /api/me/stash` | Your private stash files (id, name, size, format, share count) and the range shown; no share links in the table, `--json` includes them |
| `tahti collections list [--json]`                                                             | `GET /api/me/collections`                                                     | Your collections, newest first (slug, name, type, visibility, item count, created)                                                                                                            |
| `tahti collections show <slug> [--json]`                                                      | `GET /api/me/collections/:slug`                                               | One collection (name, type, visibility, collaborative, description) and its items (#, title, artist, track or release, length, whether it is still public); no signed audio URLs in the table |
| `tahti collections add <slug> [<sound-id>...] [--release <id>] [--json]` | `POST /api/me/collections/:slug/items` | One row per item: added, already there, or failed with the reason; exits 1 if any failed; needs the `write` scope |
| `tahti collections remove <slug> <#>` | `GET /api/me/collections/:slug`, `DELETE /api/me/collections/:slug/items/:itemId` | Removes the item numbered `#` in `collections show`; the track or release itself stays; needs the `write` scope |
| `tahti channel [<slug>] [--json]`                                                             | `GET /api/channels/:slug` (+ `GET /api/auth/me` without a slug)               | State (live with or without signal, offline), now playing, up next, next broadcast, chat on/off, stream URL; public with a slug                                                               |
| `tahti hearthis sets [--json]`                                                                | `GET /api/v1/imports/hearthis/me-sets`                                        | Your hearthis.at Sets (permalink, title, track count, year, artist)                                                                                                                           |
| `tahti hearthis set <permalink-or-url> [--json]`                                              | `GET /api/v1/imports/hearthis/sets/:permalink/tracks`                         | Tracks in one Set (#, title, artist, duration, downloadable, filename)                                                                                                                        |
| `tahti hearthis download-set <permalink-or-url> [--out <dir>] [--dry-run] [--force] [--json]` | same set-tracks route + hearthis.at `download_url`                            | Writes `Artist/Album (year)/NN - Track.ext` for downloadable tracks (lossless original when offered)                                                                                          |
| `tahti shell`                                                                                 | library / search / radio / presets + mpv IPC                                  | Interactive TUI; library play uses `GET /api/me/sound/:id/editor/source`                                                                                                                      |

Everything except `search` and `import` is a `GET` route behind `requireAuth`,
so any personal API token works. `import` sends `POST` requests and needs a
token with the `write` scope. `shell` needs a token for library playback and
`mpv` on PATH.

`import` uploads each audio file in the folder (mp3, flac, wav, aiff, m4a, aac,
ogg, opus) as a new sound, one file at a time:

- MP3 files' ID3v2 tags and FLAC files' Vorbis comments give the title, the
  artist credit, the genre and the BPM (40-300). Without a title tag, or with
  `--ignore-tags`, the title is the file name. Other formats are titled after
  the file name; album and artwork are not read.

- Hidden files, empty files and files over 2 GB are skipped; subfolders are
  only read with `--recursive`.
- A file whose title is already in your library is skipped, so running the
  import again only sends what is new. `--force` uploads it anyway.
- `--dry-run` lists what would be uploaded and sends nothing.
- One failed file does not stop the rest; the command exits with 1 if any
  file failed. `--json` prints one object per file (`file`, `title`, `artist`,
  `status`, `id`, `error`).
- Uploaded sounds are processed by Tahti afterwards, so they show as
  `PROCESSING` in `tahti library list` for a while;
  `tahti library processing --wait` returns once they are done.

`search` is public: it works without `TAHTI_API_TOKEN` and never sends the
token, since the API rejects a request carrying an invalid token even on public
routes. Words after `search` form one query (max 100 characters). The API
returns a fixed page of 20 tracks from an offset, so `--limit` (1-20) trims that
page and `--page` steps the offset by `--limit`; `--json` prints the API's page
of 20 unchanged.

Artist names in table output never show an email address: an empty or
email-like `artistName` falls back to the channel's username. `releases show`
does not print the presigned `audioUrl`s the API returns; `--json` does.

`whoami` never prints your email in table output, and shows the username if
the display name is empty. `whoami --json` is the raw `/api/auth/me` response,
which does include the `email` field.

## Errors

| Situation                                            | Message                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No `TAHTI_API_TOKEN` (every command except `search`) | `Missing API token. Create a personal API token ...`                                          |
| `tahti shell` without mpv / non-TTY                  | Install-mpv message, or “needs an interactive terminal”                                       |
| 401 (revoked, expired or wrong token)                | `Token invalid or missing scope (<API message>) ...`                                          |
| 403                                                  | `Token invalid or missing scope (<API message>): this token is not allowed to access <path>.` |
| 403 not about the token (e.g. a blocked or deleted recipient) | The API's message |
| 404                                                  | The API's message, e.g. `Sound item not found` or `Release not found`                         |
| Network failure                                      | `Could not reach the Tahti API at <url>: <reason>`                                            |
| Unknown flag or bad value                            | The problem plus a pointer to `tahti <command> --help`                                        |

All errors exit with status 1.

## Not done yet (see the roadmap doc)

- The move to [janiluuk/tahti-cli](https://github.com/janiluuk/tahti-cli) on the
  published `@tahti/api-client` SDK waits for the first npm publish; until then
  that repo copies `src/` from here.
- Shell: studio commands; the History view is for this session only, nothing is saved.
- Adding tracks to an existing release.
