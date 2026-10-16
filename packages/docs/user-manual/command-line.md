---
description: Use your Tahti account from a terminal with the tahti command.
---

# Command line (tahti-cli)

`tahti` is a small command-line tool for your Tahti account. It lists and edits your library, uploads a folder of tracks, reads your notifications, messages and feed, and has a terminal player. Everything it does goes through the same public API as tahti.live, signed in with a personal API token.

## Install

You need Node.js 20 or newer. `tahti shell` also needs [mpv](https://mpv.io/) for playback.

```bash
git clone https://github.com/janiluuk/tahti-cli.git
cd tahti-cli
npm install
npm link        # puts `tahti` on your PATH
tahti --help
```

If you work in the Tahti Player repository, the same tool is in `packages/tahti-cli`: run it with `pnpm --filter @tahti-player/tahti-cli exec tahti --help`.

## Sign in

1. On tahti.live, open **Settings → Account → API tokens** and create a token. Pick **write** access if you want to upload or change anything; a read-only token can only look.
2. Run `tahti login` and paste the token. It is checked against your account and saved to `~/.config/tahti/config.json`, readable only by you.
3. `tahti whoami` shows the account the token belongs to.

You can also skip `login` and set `TAHTI_API_TOKEN` in your shell; it wins over the saved token. `tahti logout` deletes the saved token. The token keeps working until you revoke it in Settings.

{% hint style="warning" %}
A token can do almost anything you can do on tahti.live, apart from security settings such as passwords and creating more tokens. Don't paste it into shared scripts or chats, and revoke it if it leaks.
{% endhint %}

## What you can do

Every command has `--help`. Most have `--json`, which prints the API's answer unchanged for scripts.

| Task | Command |
| --- | --- |
| Your library | `tahti library list`, `tahti library show <id>` |
| Change a track's title, genre, tags, BPM, key, visibility or downloads | `tahti library edit <id> --title "…" --public` |
| Download your original file | `tahti library download <id> --out ~/Music` |
| Delete a track | `tahti library delete <id> --yes` |
| Upload a folder of tracks | `tahti import ~/Music/new-ep` |
| Wait until uploads are processed | `tahti library processing --wait` |
| Releases | `tahti releases list`, `tahti releases show <id>` |
| Start a new release from library tracks | `tahti releases create "Night Drive EP" --type ep --sound <id> --sound <id>` |
| Publish a release or set its store links | `tahti releases edit <id> --state published`, `tahti releases edit <id> --link spotify=https://…` |
| Collections | `tahti collections list`, `show <slug>`, `add <slug> <id>…`, `remove <slug> <#>` |
| Your channel, or anyone's | `tahti channel`, `tahti channel <slug>` |
| Plays, downloads and top tracks | `tahti stats --range 30` |
| Notifications | `tahti notifications list --unread`, `tahti notifications read --all` |
| Mentions, messages and your feed | `tahti mentions`, `tahti messages list`, `tahti messages send <user> <text>`, `tahti feed` |
| Tracks you loved | `tahti likes` |
| What you bought | `tahti purchases` |
| Your private stash | `tahti stash list` |
| Blocked accounts | `tahti blocks list`, `tahti blocks add <user>`, `tahti blocks remove <user>` |
| Search public tracks | `tahti search <words>` (no token needed) |
| Download a hearthis.at set | `tahti hearthis sets`, `tahti hearthis download-set <set>` |
| Play music in the terminal | `tahti shell` |

## Uploading a folder

`tahti import <folder>` uploads every audio file in the folder (MP3, FLAC, WAV, AIFF, M4A, AAC, OGG, Opus) as a new track:

* The title, artist, genre and BPM come from the file's tags (MP3 and FLAC). Without tags, the file name becomes the title. `--ignore-tags` always uses the file name.
* A file whose title is already in your library is skipped, so you can run the same import again after adding files. `--force` uploads it anyway.
* `--dry-run` shows what would be uploaded. `--recursive` includes subfolders.
* New tracks are public, like an upload on tahti.live, and join your channel's 24/7 rotation if you have that turned on. Use `--dry-run` first, and `tahti library edit <id> --private` to hide one.
* Tahti processes each track before it plays. `tahti library processing --wait` returns when they are ready, so a script can then add them to a collection.

## The terminal player

`tahti shell` opens a full-screen player with your library, search, the tracks you loved, Tahti Radio and internet radio stations, and a queue. Press `?` inside it for the keys: `Tab` moves between panes, `Enter` plays, `Space` pauses, `n`/`p` skip, `/` searches and `q` quits.
