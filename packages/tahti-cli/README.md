# @tahti-player/tahti-cli

Terminal-first CLI for Tahti — thin, scriptable access to the public Tahti
API, in the spirit of [antiwork/gumroad-cli](https://github.com/antiwork/gumroad-cli).

**Standalone docs + cheatsheet:**
[janiluuk/tahti-cli](https://github.com/janiluuk/tahti-cli) (shell key map,
related repos). This package is the monorepo copy used in day-to-day player
development; see [`docs/todo/tahti-cli-tool.md`](../../docs/todo/tahti-cli-tool.md).

## Scope

Read-only commands, plus `import` (folder upload), `sounds upload`, `hearthis release` (hearthis.at Set or track → draft release), `hearthis collection` (hearthis.at Set → collection), `collections create`, `hearthis import-embeds` (hearthis.at embeds → real uploads) and `shell` (interactive
TUI with mpv playback). Capability catalogs used by Tahti Player
(`GET /api/me/import-plugins`, `GET /api/me/export-plugins`) are **not** CLI
commands yet — call them with `curl`/`fetch` against the same API if you need
registry discovery from scripts.

### Interactive shell (`tahti shell`)

Opens a blessed TUI: Library · Search · Likes · Radio · Queue · History (newest first, at most 100, kept between sessions in `shell-history.json` next to the saved login config; live streams and signed library links are not saved). Playback is delegated
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
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 428061-9675121 --layout album --own --out ~/Music/Yaniho
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 192177-9675121 --layout set --own --title "Archive 2001-2009" --out ~/Music/Yaniho/Sets
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 192177-9675121 --layout set --own --title "Archive 2001-2009" --sync --flac --out ~/Music/Archive
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set 428061-9675121 532908-9675121 --layout album --own --sync --out ~/Music/Albums
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis user-sets yaniho --match '^Archive'
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set --resync ~/Music
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis download-set --from-user yaniho --match '^(Yani|Don)' --layout album --own --sync --out ~/Music/Albums
```

Layout: `Artist/Album (year)/01 - Track.ext`

#### hearthis.at embeds → real uploads

Sounds imported from hearthis.at as embeds play hearthis.at's stream.
`tahti hearthis import-embeds` asks Tahti to download each embed's audio from
hearthis.at and attach it, so the sound becomes a real upload (same sound:
plays, likes and collections stay).

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis import-embeds --dry-run
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis import-embeds
```

- Only tracks with downloads enabled on hearthis.at import; the rest are listed
  as "not downloadable". Turn downloads on for them on hearthis.at and run it
  again; already-imported sounds are skipped.
- The download runs in the background; each sound switches over in Library →
  Sounds when its file is in. Needs a token with the `write` scope.

#### hearthis.at → Tahti release

`tahti hearthis release` re-makes a hearthis.at Set (or one track) as a draft
Tahti release: it downloads the original audio of the owner's tracks, uploads
each file as a sound in Set order, creates the release from those sounds, sets
the Set cover and prints the Studio URL.

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis release https://hearthis.at/set/428061-9675121/ --out ~/Music/Albums --dry-run
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis release https://hearthis.at/set/428061-9675121/ --out ~/Music/Albums
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis release https://hearthis.at/yaniho/night-drive/ --out ~/Music/Singles
```

- Title, description, genre, release date (earliest track date) and order come
  from hearthis.at; `--title`, `--type`, `--date` and `--tracks` override them.
  Type defaults to single (1 track), EP (2-6) or album (7+).
- Each sound gets the track's genre, tags, BPM, description and release day.
- Tracks uploaded by other hearthis.at accounts are left out. A chosen track
  that is not downloadable (and not already uploaded) stops the run; leave it
  out with `--tracks`.
- A track that already has a Tahti sound is reused, not uploaded again (see
  [the upload ledger](#the-upload-ledger-no-track-uploaded-twice)).
- An existing release with the same title stops the run before anything is
  uploaded; `--force-new` creates another one.
- The release id lives in `<out>/.tahti-release-<permalink>.json`. If an
  upload fails, no release is created; run the same command again and only the
  missing sounds are downloaded and uploaded. After the release exists, a
  rerun prints it instead of creating a second one.
- The new tracks play the uploaded audio; no hearthis.at embed is made.
- `TAHTI_WEB_URL` sets the web address in the printed URL when the API is not
  on an `api.<host>` address.

#### hearthis.at → Tahti collection

`tahti hearthis collection` re-makes a hearthis.at Set as a Tahti collection:
it reuses or uploads a sound for each of the owner's tracks, creates the
collection once (Set title, description and cover) and adds the sounds in Set
order. `tahti collections create` makes an empty one by hand.

```bash
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis user-sets yaniho
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis collection https://hearthis.at/set/428061-9675121/ --out ~/Music/hearthis --type mix-series --dry-run
pnpm --filter @tahti-player/tahti-cli exec tahti hearthis collection https://hearthis.at/set/428061-9675121/ --out ~/Music/hearthis --type mix-series
pnpm --filter @tahti-player/tahti-cli exec tahti collections create "Nightriders" --type mix-series --private --cover-url https://img.hearthis.at/…/cover.jpg
```

- Use the same `--out` (or `--ledger`) for every Set and release of the
  account, so the runs share one ledger.
- A track that is not downloadable, or fails to download or upload, is skipped
  and listed in the summary; the run still creates and fills the collection,
  and exits with 1. `--strict` stops instead, before anything changes.
- New uploads have to finish processing before they can be added: the run
  waits up to `--wait` seconds (default 600). Tracks still processing are
  listed; run the same command again later to add them.
- The slug lives in `<out>/.tahti-collection-<permalink>.json`: a rerun never
  creates a second collection and only adds what is missing, each in its Set
  position. Without a state file, a collection of yours with the same name
  stops the run; `--slug <slug>` fills that one instead.
- `--type` is `mix-series`, `album` or `custom` (the API default);
  `--private` makes it a draft only you see, `--visibility` takes `public`,
  `unlisted` or `draft`.

#### The upload ledger: no track uploaded twice

`hearthis release` and `hearthis collection` share
`<out>/.tahti-hearthis-sounds.json` (`--ledger <path>` to move it), which maps
each hearthis.at track id to its Tahti sound id. Before uploading a track
they look for an existing sound:

1. the ledger (an entry whose sound is no longer in your library is dropped
   and the track is uploaded again);
2. your library (`GET /api/me/sound`, read in pages of 100): a sound exported
   to hearthis.at as that track (`hearthisExportId`), else an uploaded sound
   with the same title (case and spacing ignored) and a length within 2 s.
   hearthis.at embeds are never reused, and neither are sounds that failed
   processing.

Library matches and every new upload are written to the ledger right away.
Sound ids kept by older `hearthis release` runs in
`<out>/.tahti-release-*.json` are copied into the ledger on the next run.
`--dry-run` shows which tracks would be uploaded and which reused, and writes
nothing.

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
   tokens → create a token, **or** use a device session (step 2b).
2. Run `tahti login` and paste the token (or pipe it in: `pass tahti | tahti login`).
   It is checked, then saved to `$XDG_CONFIG_HOME/tahti/config.json`
   (`~/.config/tahti/config.json`), readable only by you. `tahti logout`
   deletes that file. Alternatively `export TAHTI_API_TOKEN=tahti_...`, which
   wins over the saved token.
   2b. Or `tahti login --device` with your account email/password. That stores
   access + refresh JWTs (mode 600) and refreshes them on 401. Prefer a
   personal API token for automation and for accounts with TOTP.
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

| Command                                                                                                                                                                              | API route                                                                                                       | Output                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tahti whoami [--json]`                                                                                                                                                              | `GET /api/auth/me`                                                                                              | Username, display name, tier, membership, channel slug, storage used                                                                                                                                                                               |
| `tahti login [--token <token>] [--device] [--email] [--password]` / `tahti logout`                                                                                                   | `GET /api/auth/me` or `POST /api/auth/login` (+ refresh on 401)                                                 | Saves a personal API token or a device JWT session to `~/.config/tahti/config.json` (mode 600), or deletes that file; `TAHTI_API_TOKEN` still wins when set                                                                                        |
| `tahti library list [--sort <order>] [--json]`                                                                                                                                       | `GET /api/me/sound`                                                                                             | Your library sounds (up to 100); `--sort` is one of `newest`, `oldest`, `title`, `duration`, `bpm`, `genre`                                                                                                                                        |
| `tahti library show <id> [--json]`                                                                                                                                                   | `GET /api/me/sound/:id`                                                                                         | One sound's metadata (status, duration, visibility, genre, BPM/key, source format, dates)                                                                                                                                                          |
| `tahti library edit <id> [--title] [--description] [--genre] [--tags] [--bpm] [--key] [--public \| --private] [--downloads on\|off] [--json]`                                        | `PATCH /api/me/sound/:id`                                                                                       | Changes only the given fields and prints the sound as saved; `""` or `none` clears a field; needs the `write` scope                                                                                                                                |
| `tahti library delete <id> --yes`                                                                                                                                                    | `GET /api/me/sound/:id`, `DELETE /api/me/sound/:id`                                                             | Deletes the sound and all its versions; without `--yes` it names the sound and stops; needs the `write` scope                                                                                                                                      |
| `tahti library download <id> [--out <dir>] [--force] [--url] [--json]`                                                                                                               | `GET /api/me/sound/:id/download` + the signed storage link                                                      | Saves the original upload (else FLAC, else MP3) under the API's file name; `--url` prints the hour-long signed link instead                                                                                                                        |
| `tahti library processing [--wait] [--timeout <s>] [--json]`                                                                                                                         | `GET /api/me/sound/processing`                                                                                  | Sounds still `PENDING` or `PROCESSING` (id, status, title); `--wait` checks every 5 s until none are left and exits 1 after `--timeout` (default 600 s)                                                                                            |
| `tahti releases list [--page <n>] [--limit <n>] [--json]`                                                                                                                            | `GET /api/me/releases`                                                                                          | Your releases (id, title, type, state, release date, track count); `--limit` is 1-100                                                                                                                                                              |
| `tahti releases show <id> [--json]`                                                                                                                                                  | `GET /api/me/releases/:id`                                                                                      | One release (type, state, release date, genre, UPC, label, smart link and its views, catalog checklist) plus its tracklist (position, title, duration, status, ISRC)                                                                               |
| `tahti releases create <title> [--type <t>] [--date <YYYY-MM-DD>] [--description <t>] [--genre <g>] [--sound <id>...] [--json]`                                                      | `GET /api/me/sound/:id` per `--sound`, `POST /api/me/releases`                                                  | Creates a draft release (default: a single released today); each `--sound` becomes a track titled after the sound; needs the `write` scope                                                                                                         |
| `tahti releases edit <id> [--state draft\|published\|archived] [--description <t>] [--date <YYYY-MM-DD>] [--pin \| --unpin] [--footer on\|off] [--link <service>=<url>...] [--json]` | `PATCH /api/me/releases/:id` (plus `GET /api/me/releases/:id` for `--link`)                                     | Changes only the given fields and prints the release as saved; `--link` merges onto the existing store links (an empty URL removes one); publishing needs a track; needs the `write` scope                                                         |
| `tahti releases add-tracks <id> --sound <id>... [--json]`                                                                                                                            | `GET /api/me/releases/:id`, `GET /api/me/sound/:id` per `--sound`, `POST /api/me/releases/:id/tracks` per sound | Adds library sounds as tracks after the existing ones, in the order given, titled after the sound; prints the new tracklist (`--json`: the added tracks); needs the `write` scope                                                                  |
| `tahti search <query> [--page <n>] [--limit <n>] [--json]`                                                                                                                           | `GET /api/v1/search/tracks`                                                                                     | Public, ready tracks whose title matches (id, title, artist, duration, channel), newest first                                                                                                                                                      |
| `tahti import <folder> [--recursive] [--dry-run] [--force] [--ignore-tags] [--json]`                                                                                                 | `POST /api/uploads/prepare`, storage `PUT`, `POST /api/uploads/complete`                                        | One row per audio file: uploaded (with the new sound id), skipped, or failed with the reason                                                                                                                                                       |
| `tahti sounds upload <file>... [--title <t>] [--genre <g>] [--tag <t>...] [--description <t>] [--ignore-tags] [--json]` | `POST /api/uploads/prepare`, storage `PUT`, `POST /api/uploads/complete` | One row per file: uploaded with the new sound id, or failed with the reason; write scope |
| `tahti notifications list [--limit <n>] [--unread] [--json]`                                                                                                                         | `GET /api/me/notifications`                                                                                     | Your notifications, newest first (id, unread mark, date, type, sender, title) and the unread total; `--limit` is 1-50                                                                                                                              |
| `tahti notifications read <id> \| --all`                                                                                                                                             | `PATCH /api/me/notifications/:id/read`, `POST /api/me/notifications/read-all`                                   | Marks one notification read, or every non-sticky one with `--all`; needs the `write` scope                                                                                                                                                         |
| `tahti stats [--range <days>] [--json]`                                                                                                                                              | `GET /api/me/stats/summary`, `GET /api/me/stats/top-tracks`                                                     | Plays and downloads today and in total, followers, and the ten most played tracks; `--range` is `1`, `7`, `30` or `all` (default)                                                                                                                  |
| `tahti purchases [--json]`                                                                                                                                                           | `GET /api/me/purchases`                                                                                         | Paid purchases, newest first (date, artist, tier, amount in euros, tracks it unlocked)                                                                                                                                                             |
| `tahti blocks list [--json]`                                                                                                                                                         | `GET /api/me/blocks`                                                                                            | Accounts you have blocked (username, name, date)                                                                                                                                                                                                   |
| `tahti blocks add <username>` / `tahti blocks remove <username>`                                                                                                                     | `POST /api/me/blocks`, `DELETE /api/me/blocks/:username`                                                        | Blocks or unblocks; a block also removes follows, loves, reposts and subscriptions between you, and unblocking does not restore them; needs the `write` scope                                                                                      |
| `tahti discussions list [--json]`                                                                                                                                                    | `GET /api/v1/governance/discussions`                                                                            | Board-opened discussion topics: id, title, replies, new replies, last activity, pinned/closed/following/muted; members only                                                                                                                        |
| `tahti discussions show <id> [--before <reply#>] [--json]`                                                                                                                           | `GET /api/v1/governance/discussions/:id`, `…/posts?before=`                                                     | The topic text and its latest replies, oldest first; long threads print the `--before` command for earlier ones; opening a followed topic marks it read                                                                                            |
| `tahti discussions reply <id> <text...>`                                                                                                                                             | `POST /api/v1/governance/discussions/:id/posts`                                                                 | Reply to a topic (follows it); write scope                                                                                                                                                                                                         |
| `tahti discussions edit <id> <reply#> <text...>`                                                                                                                                     | `PATCH /api/v1/governance/discussions/:id/posts/:postId`                                                        | Fix your own reply while the topic is open (marked edited); write scope                                                                                                                                                                            |
| `tahti discussions read-all`                                                                                                                                                         | `POST /api/v1/governance/discussions/read-all`                                                                  | Mark every followed topic read; write scope                                                                                                                                                                                                        |
| `tahti discussions follow\|unfollow <id>`                                                                                                                                            | `PUT /api/v1/governance/discussions/:id/follow`                                                                 | Follow a topic without replying, or stop following; write scope                                                                                                                                                                                    |
| `tahti discussions mute\|unmute <id>`                                                                                                                                                | `PUT /api/v1/governance/discussions/:id/mute`                                                                   | Keep following without notifications, or turn them back on; write scope                                                                                                                                                                            |
| `tahti like\|unlike <channel> <track-id>`                                                                                                                                            | `POST\|DELETE /api/v1/c/:channel/sounds/:id/like`                                                               | Love a track or take it back; prints the new public count; write scope                                                                                                                                                                             |
| `tahti mentions [--limit <n>] [--json]`                                                                                                                                              | `GET /api/me/mentions`                                                                                          | Where other artists @mentioned you, newest first (date, who, bio/announcement/release/newsletter/tracklist/chat, title or link); `--limit` is 1-50                                                                                                 |
| `tahti messages list [--json]`                                                                                                                                                       | `GET /api/me/messages/conversations`                                                                            | Conversations (who, unread, updated, start of the last message) and the unread total; does not mark anything read                                                                                                                                  |
| `tahti messages send <username> <message...>`                                                                                                                                        | `POST /api/me/messages/conversations`, `POST /api/me/messages/conversations/:id/messages`                       | Sends one message, starting the conversation if needed; needs the `write` scope                                                                                                                                                                    |
| `tahti feed [--limit <n>] [--json]`                                                                                                                                                  | `GET /api/me/feed`                                                                                              | Recent posts, tracks and releases from artists you follow (date, artist, kind, title or start of the post)                                                                                                                                         |
| `tahti likes [--limit <n>] [--json]`                                                                                                                                                 | `GET /api/me/likes`                                                                                             | Tracks you loved, newest first (date, artist, title, id); `--limit` is 1-100 (default 50)                                                                                                                                                          |
| `tahti stash list [--page <n>] [--limit <n>] [--json]`                                                                                                                               | `GET /api/me/stash`                                                                                             | Your private stash files (id, name, size, format, share count) and the range shown; no share links in the table, `--json` includes them                                                                                                            |
| `tahti collections list [--json]`                                                                                                                                                    | `GET /api/me/collections`                                                                                       | Your collections, newest first (slug, name, type, visibility, item count, created)                                                                                                                                                                 |
| `tahti collections create <name> [--slug <s>] [--type <t>] [--description <t>] [--private \| --visibility <v>] [--cover-url <url>] [--json]` | `POST /api/me/collections`, `POST /api/me/collections/:slug/cover/from-url` | The new collection's slug, name, type, visibility and whether the cover was set; exits 1 if the cover could not be set; needs the `write` scope |
| `tahti collections show <slug> [--json]`                                                                                                                                             | `GET /api/me/collections/:slug`                                                                                 | One collection (name, type, visibility, collaborative, description) and its items (#, title, artist, track or release, length, whether it is still public); no signed audio URLs in the table                                                      |
| `tahti collections add <slug> [<sound-id>...] [--release <id>] [--json]`                                                                                                             | `POST /api/me/collections/:slug/items`                                                                          | One row per item: added, already there, or failed with the reason; exits 1 if any failed; needs the `write` scope                                                                                                                                  |
| `tahti collections remove <slug> <#>`                                                                                                                                                | `GET /api/me/collections/:slug`, `DELETE /api/me/collections/:slug/items/:itemId`                               | Removes the item numbered `#` in `collections show`; the track or release itself stays; needs the `write` scope                                                                                                                                    |
| `tahti track <id-or-link> [--json]`                                                                                                                                                  | `GET /api/v1/tracks/:id`                                                                                        | A public track: title, artist, length, genre, release date, and its plays, likes, downloads and comments; public, no token                                                                                                                         |
| `tahti channel [<slug>] [--json]`                                                                                                                                                    | `GET /api/channels/:slug` (+ `GET /api/auth/me` without a slug)                                                 | State (live with or without signal, offline), now playing, up next, next broadcast, chat on/off, stream URL; public with a slug                                                                                                                    |
| `tahti hearthis sets [--json]`                                                                                                                                                       | `GET /api/v1/imports/hearthis/me-sets`                                                                          | Your hearthis.at Sets (permalink, title, track count, year, artist)                                                                                                                                                                                |
| `tahti hearthis set <permalink-or-url> [--json]`                                                                                                                                     | `GET /api/v1/imports/hearthis/sets/:permalink/tracks`                                                           | Tracks in one Set (#, title, artist, duration, downloadable, filename)                                                                                                                                                                             |
| `tahti hearthis download-set <permalink-or-url> [--out <dir>] [--layout <l>] [--own] [--title <t>] [--dry-run] [--force] [--json]`                                                   | same set-tracks route + hearthis.at `download_url`                                                              | Writes `Artist/Album (year)/NN - Track.ext` for downloadable tracks (lossless original when offered); `--layout album` writes `Artist - Album (year)/NN - Track.ext`, `--layout set` writes `Set/Track.ext`; `--own` skips other uploaders' tracks; several permalinks run one after another, with a progress line per track on stderr; `--exclude <regex>` and `--tracks 1,3-5` pick tracks (the others stay on disk with `--sync`); `--cover-name folder` saves `folder.jpg`; every downloaded folder gets a `.hearthis-set.json`, and `--resync <dir>` syncs all of them again with the same options; `--sync` re-downloads files whose size changed and deletes ones no longer in the Set (a track's old copy in another format is only removed once the new file exists); `--flac` converts WAV/AIFF with ffmpeg (an original that is really MP3 stays MP3 even when its download name says .wav; the Content-Type decides); the Set cover is saved as `cover.jpg` |
| `tahti hearthis collection <set-url-or-permalink> [--out <dir>] [--ledger <path>] [--name <t>] [--slug <s>] [--type <t>] [--private \| --visibility <v>] [--tracks <list>] [--flac] [--wait <seconds>] [--strict] [--dry-run] [--json]` | set-tracks route, `GET /api/me/sound` (paged), `GET /api/me/collections[/:slug]`, the upload routes, `GET /api/me/sound/processing`, `POST /api/me/collections`, `.../cover/from-url`, `POST /api/me/collections/:slug/items` | Each track's sound (uploaded, reused from the ledger or library, skipped) and collection result (added, already there, processing, skipped), plus a summary and the Studio URL; exits 1 when anything was skipped or left; write scope |
| `tahti hearthis release <set-or-track-url> [--out <dir>] [--ledger <path>] [--title <t>] [--type <t>] [--date <YYYY-MM-DD>] [--tracks <list>] [--flac] [--force-new] [--dry-run] [--json]` | set-tracks route (or hearthis.at's public API for one track), `GET /api/me/releases`, `GET /api/me/sound` (paged), the upload routes, `GET /api/me/sound/:id`, `POST /api/me/releases`, `POST /api/me/releases/:id/artwork/from-url` | The release, its tracks with their upload status, and the Studio URL of the new draft release; write scope |
| `tahti shell`                                                                                                                                                                        | library / search / radio / presets + mpv IPC                                                                    | Interactive TUI; library play uses `GET /api/me/sound/:id/editor/source`                                                                                                                                                                           |

Everything except `search` and `import` is a `GET` route behind `requireAuth`,
so any personal API token works. `import` sends `POST` requests and needs a
token with the `write` scope. `shell` needs a token for library playback and
`mpv` on PATH.

`import` uploads each audio file in the folder (mp3, flac, wav, aiff, m4a, aac,
ogg, opus) as a new sound, one file at a time:

- Tags give the title, the artist credit, the genre and the BPM (40-300):
  ID3v2 in MP3, Vorbis comments in FLAC, Ogg Vorbis and Opus, and iTunes items
  in M4A. Without a title tag, or with `--ignore-tags`, the title is the file
  name. WAV, AIFF and AAC files are titled after the file name. Album and
  artwork are not read, since the upload API has no field for them.

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

| Situation                                                     | Message                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| No `TAHTI_API_TOKEN` (every command except `search`)          | `Missing API token. Create a personal API token ...`                                          |
| `tahti shell` without mpv / non-TTY                           | Install-mpv message, or “needs an interactive terminal”                                       |
| 401 (revoked, expired or wrong token)                         | `Token invalid or missing scope (<API message>) ...`                                          |
| 403                                                           | `Token invalid or missing scope (<API message>): this token is not allowed to access <path>.` |
| 403 not about the token (e.g. a blocked or deleted recipient) | The API's message                                                                             |
| 404                                                           | The API's message, e.g. `Sound item not found` or `Release not found`                         |
| Network failure                                               | `Could not reach the Tahti API at <url>: <reason>`                                            |
| Unknown flag or bad value                                     | The problem plus a pointer to `tahti <command> --help`                                        |

All errors exit with status 1.

## Not done yet (see the roadmap doc)

- The move to [janiluuk/tahti-cli](https://github.com/janiluuk/tahti-cli) on the
  published `@tahti/api-client` SDK waits for the first npm publish; until then
  that repo copies `src/` from here.
- Shell: studio commands.
- Adding tracks to an existing release.
