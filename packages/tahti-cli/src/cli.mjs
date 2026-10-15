#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { CliError, resolveConfig } from './api-client.mjs';
import {
  runBlocksAdd,
  runBlocksList,
  runBlocksRemove,
} from './commands/blocks.mjs';
import { runChannel } from './commands/channel.mjs';
import {
  runCollectionsAdd,
  runCollectionsRemove,
} from './commands/collections-edit.mjs';
import { runCollectionsList } from './commands/collections-list.mjs';
import { runCollectionsShow } from './commands/collections-show.mjs';
import { runFeed } from './commands/feed.mjs';
import { runHearthisDownloadSet } from './commands/hearthis-download-set.mjs';
import { runHearthisSet } from './commands/hearthis-set.mjs';
import { runHearthisSets } from './commands/hearthis-sets.mjs';
import { runImport } from './commands/import.mjs';
import { runLibraryDelete } from './commands/library-delete.mjs';
import { runLibraryDownload } from './commands/library-download.mjs';
import { runLibraryEdit } from './commands/library-edit.mjs';
import { LIBRARY_SORTS, runLibraryList } from './commands/library-list.mjs';
import { runLibraryProcessing } from './commands/library-processing.mjs';
import { runLibraryShow } from './commands/library-show.mjs';
import { MAX_MENTIONS_LIMIT, runMentions } from './commands/mentions.mjs';
import { runMessagesList, runMessagesSend } from './commands/messages.mjs';
import { runNotificationsList } from './commands/notifications-list.mjs';
import { runNotificationsRead } from './commands/notifications-read.mjs';
import { runPurchases } from './commands/purchases.mjs';
import { runReleasesList } from './commands/releases-list.mjs';
import { runReleasesShow } from './commands/releases-show.mjs';
import { runSearch, SEARCH_PAGE_SIZE } from './commands/search.mjs';
import { runStats, STATS_RANGES } from './commands/stats.mjs';
import { runWhoami } from './commands/whoami.mjs';
import { runShell } from './shell/shell.mjs';

const JSON_OPTION = { json: { type: 'boolean', default: false } };

const COMMANDS = [
  {
    path: ['whoami'],
    usage: 'tahti whoami [--json]',
    summary: 'Show the account the API token belongs to',
    details: `Calls GET /api/auth/me and prints your username, display name, tier,
membership and channel. --json prints the full API response unchanged.`,
    options: JSON_OPTION,
    run: (config, { values }) => runWhoami(config, { json: values.json }),
  },
  {
    path: ['library', 'list'],
    usage: 'tahti library list [--sort <order>] [--json]',
    summary: 'List your own library sounds',
    details: `Calls GET /api/me/sound (up to 100 items).
  --sort <order>   One of: ${LIBRARY_SORTS.join(', ')} (default: newest)`,
    options: { ...JSON_OPTION, sort: { type: 'string' } },
    run: (config, { values }) =>
      runLibraryList(config, { json: values.json, sort: values.sort }),
  },
  {
    path: ['library', 'show'],
    usage: 'tahti library show <id> [--json]',
    summary: 'Show one of your library sounds',
    details: 'Calls GET /api/me/sound/:id. Get ids from `tahti library list`.',
    options: JSON_OPTION,
    positionals: 1,
    run: (config, { values, positionals }) =>
      runLibraryShow(config, positionals[0], { json: values.json }),
  },
  {
    path: ['library', 'edit'],
    usage: 'tahti library edit <id> <field flags> [--json]',
    summary: 'Change the metadata of one of your library sounds',
    details: `Calls PATCH /api/me/sound/:id with only the fields you give and prints the
sound as saved. Needs a token with the write scope.
  --title <t>          New title (1-200 characters)
  --description <t>    New description; "" clears it
  --genre <g>          Main genre; "" clears it
  --tags <a,b>         Replaces the tags (comma-separated, at most 20)
  --bpm <n>            40-300, or "none" to clear it
  --key <k>            Musical key, e.g. Am; "" clears it
  --public, --private  Show or hide the sound on your profile
  --downloads on|off   Allow or block downloads (streaming is unaffected)`,
    options: {
      ...JSON_OPTION,
      title: { type: 'string' },
      description: { type: 'string' },
      genre: { type: 'string' },
      tags: { type: 'string' },
      bpm: { type: 'string' },
      key: { type: 'string' },
      public: { type: 'boolean', default: false },
      private: { type: 'boolean', default: false },
      downloads: { type: 'string' },
    },
    positionals: 1,
    run: (config, { values, positionals }) =>
      runLibraryEdit(config, positionals[0], values),
  },
  {
    path: ['library', 'delete'],
    usage: 'tahti library delete <id> --yes',
    summary: 'Delete one of your library sounds',
    details: `Looks the sound up with GET /api/me/sound/:id, then calls DELETE
/api/me/sound/:id. Without --yes it only names the sound and stops. Deleting
removes every version and its place in your rotation, and cannot be undone.
Needs a token with the write scope.
  --yes   Really delete it`,
    options: { yes: { type: 'boolean', default: false } },
    positionals: 1,
    run: (config, { values, positionals }) =>
      runLibraryDelete(config, positionals[0], { yes: values.yes }),
  },
  {
    path: ['library', 'download'],
    usage:
      'tahti library download <id> [--out <dir>] [--force] [--url] [--json]',
    summary: 'Download the original audio file of one of your sounds',
    details: `Calls GET /api/me/sound/:id/download for a signed link (valid for an hour) to
the best file Tahti keeps: the upload as sent, else FLAC, else MP3. The file
is saved under the name the API gives, made safe for the file system.
  --out <dir>   Destination folder (default: current directory)
  --force       Replace a file that already exists
  --url         Print the signed link instead of downloading`,
    options: {
      ...JSON_OPTION,
      out: { type: 'string' },
      force: { type: 'boolean', default: false },
      url: { type: 'boolean', default: false },
    },
    positionals: 1,
    run: (config, { values, positionals }) =>
      runLibraryDownload(config, positionals[0], {
        json: values.json,
        outDir: values.out || '.',
        force: values.force,
        url: values.url,
      }),
  },
  {
    path: ['library', 'processing'],
    usage: 'tahti library processing [--wait] [--timeout <s>] [--json]',
    summary: 'List the sounds Tahti is still processing',
    details: `Calls GET /api/me/sound/processing (up to 50, newest first). Handy after
\`tahti import\`: uploads stay PENDING or PROCESSING for a while.
  --wait          Check every 5 s until nothing is processing
  --timeout <s>   Give up waiting after this many seconds (default: 600);
                  exits with 1 if something is still processing`,
    options: {
      ...JSON_OPTION,
      wait: { type: 'boolean', default: false },
      timeout: { type: 'string' },
    },
    run: (config, { values }) =>
      runLibraryProcessing(config, {
        json: values.json,
        wait: values.wait,
        timeout: values.timeout,
      }),
  },
  {
    path: ['releases', 'list'],
    usage: 'tahti releases list [--page <n>] [--limit <n>] [--json]',
    summary: 'List your releases (albums, EPs, singles)',
    details: `Calls GET /api/me/releases, newest release date first.
  --page <n>    Page number (default: 1)
  --limit <n>   Releases per page, 1-100 (default: 100)`,
    options: {
      ...JSON_OPTION,
      page: { type: 'string' },
      limit: { type: 'string' },
    },
    run: (config, { values }) =>
      runReleasesList(config, {
        json: values.json,
        page: values.page,
        limit: values.limit,
      }),
  },
  {
    path: ['releases', 'show'],
    usage: 'tahti releases show <id> [--json]',
    summary: 'Show one of your releases with its tracklist',
    details: `Calls GET /api/me/releases/:id. Get ids from \`tahti releases list\`.`,
    options: JSON_OPTION,
    positionals: 1,
    run: (config, { values, positionals }) =>
      runReleasesShow(config, positionals[0], { json: values.json }),
  },
  {
    path: ['search'],
    usage: 'tahti search <query> [--page <n>] [--limit <n>] [--json]',
    summary: 'Search public tracks by title',
    details: `Calls GET /api/v1/search/tracks, newest first. Public: works without
TAHTI_API_TOKEN and never sends it. Words after "search" form one query.
  --page <n>    Page number (default: 1)
  --limit <n>   Tracks per page, 1-${SEARCH_PAGE_SIZE} (default: ${SEARCH_PAGE_SIZE}); --json prints the
                API's page of ${SEARCH_PAGE_SIZE} unchanged`,
    options: {
      ...JSON_OPTION,
      page: { type: 'string' },
      limit: { type: 'string' },
    },
    positionals: Infinity,
    run: (config, { values, positionals }) =>
      runSearch(config, positionals.join(' '), {
        json: values.json,
        page: values.page,
        limit: values.limit,
      }),
  },
  {
    path: ['import'],
    usage: 'tahti import <folder> [--recursive] [--dry-run] [--force] [--json]',
    summary: 'Upload the audio files in a folder to your library',
    details: `Uploads each audio file (mp3, flac, wav, aiff, m4a, aac, ogg, opus) as a new
sound, titled after its file name. Files whose title is already in your library
are skipped, so running it again only sends what is new. Needs a token with
the write scope. Exits with 1 when any file fails.
  --recursive   Include subfolders
  --dry-run     List what would be uploaded without sending anything
  --force       Upload even when the title is already in your library`,
    options: {
      ...JSON_OPTION,
      recursive: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
    },
    positionals: 1,
    run: (config, { values, positionals }) => {
      if (!positionals[0]) {
        throw new CliError(
          'Missing folder.\nRun `tahti import --help` for usage.',
        );
      }
      return runImport(config, positionals[0], {
        json: values.json,
        recursive: values.recursive,
        dryRun: values['dry-run'],
        force: values.force,
      });
    },
  },
  {
    path: ['hearthis', 'sets'],
    usage: 'tahti hearthis sets [--json]',
    summary: 'List your hearthis.at Sets (playlists / album-like groups)',
    details: `Calls GET /api/v1/imports/hearthis/me-sets. Requires a personal API token and
a hearthis.at handle on your Tahti profile (Settings → Profile). On hearthis.at
a "Set" is usually an album-like grouping but can also be a playlist.
Use \`tahti hearthis set <permalink>\` to inspect tracks in one set.`,
    options: JSON_OPTION,
    run: (config, { values }) => runHearthisSets(config, { json: values.json }),
  },
  {
    path: ['hearthis', 'set'],
    usage: 'tahti hearthis set <permalink-or-url> [--json]',
    summary: 'List tracks in one hearthis.at Set',
    details: `Calls GET /api/v1/imports/hearthis/sets/:permalink/tracks.
Accepts a bare permalink from \`tahti hearthis sets\` or a full
https://hearthis.at/set/<permalink>/ URL. Shows whether each track is
downloadable.`,
    options: JSON_OPTION,
    positionals: 1,
    run: (config, { values, positionals }) =>
      runHearthisSet(config, positionals[0], { json: values.json }),
  },
  {
    path: ['hearthis', 'download-set'],
    usage:
      'tahti hearthis download-set <permalink-or-url> [--out <dir>] [--dry-run] [--force] [--json]',
    summary: 'Download a hearthis.at Set into Artist/Album (year)/01 - Track',
    details: `Fetches the Set tracklist, then downloads every track that is
downloadable for the authenticated hearthis.at visitor (public download
flag). Files go under:
  <out>/<Artist>/<Album (year)>/<NN> - <Track>.<ext>
Uses hearthis.at's download_url (original upload — often WAV/FLAC), never
the compressed stream preview. Skips tracks that are not downloadable and
paths that already exist (unless --force).
  --out <dir>   Destination root (default: current directory)
  --dry-run     List paths without downloading
  --force       Re-download even when the file already exists`,
    options: {
      ...JSON_OPTION,
      out: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
    },
    positionals: 1,
    run: (config, { values, positionals }) =>
      runHearthisDownloadSet(config, positionals[0], {
        json: values.json,
        outDir: values.out || '.',
        dryRun: values['dry-run'],
        force: values.force,
      }),
  },
  {
    path: ['notifications', 'list'],
    usage: 'tahti notifications list [--limit <n>] [--unread] [--json]',
    summary: 'List your notifications, newest first',
    details: `Calls GET /api/me/notifications. Unread rows are marked with * and the\nunread total is printed under the table.
  --limit <n>   How many to fetch, 1-50 (default: 30)
  --unread      Show only the unread ones from what was fetched`,
    options: {
      ...JSON_OPTION,
      limit: { type: 'string' },
      unread: { type: 'boolean', default: false },
    },
    run: (config, { values }) =>
      runNotificationsList(config, {
        json: values.json,
        limit: values.limit,
        unread: values.unread,
      }),
  },
  {
    path: ['notifications', 'read'],
    usage: 'tahti notifications read <id> | --all',
    summary: 'Mark a notification, or all of them, read',
    details: `Calls PATCH /api/me/notifications/:id/read, or POST
/api/me/notifications/read-all with --all. --all leaves sticky notices
(announcements you must acknowledge) unread; mark those by id. Needs a
token with the write scope. Get ids from \`tahti notifications list\`.
  --all         Mark every non-sticky notification read`,
    options: { all: { type: 'boolean', default: false } },
    positionals: 1,
    run: (config, { values, positionals }) =>
      runNotificationsRead(config, positionals[0], { all: values.all }),
  },
  {
    path: ['stats'],
    usage: 'tahti stats [--range <days>] [--json]',
    summary: 'Show your plays, downloads, followers and top tracks',
    details: `Calls GET /api/me/stats/summary and GET /api/me/stats/top-tracks (the ten
most played tracks). The counters are today and all time; --range sets the
window for the top tracks.
  --range <days>   One of: ${STATS_RANGES.join(', ')} (default: all)
--json prints { summary, topTracks } as the API sent them.`,
    options: { ...JSON_OPTION, range: { type: 'string' } },
    run: (config, { values }) =>
      runStats(config, { json: values.json, range: values.range }),
  },
  {
    path: ['purchases'],
    usage: 'tahti purchases [--json]',
    summary: 'List the music you have bought on Tahti',
    details: `Calls GET /api/me/purchases: paid purchases, newest first, with the artist,
the tier, the amount in euros and the tracks it unlocked.`,
    options: JSON_OPTION,
    run: (config, { values }) => runPurchases(config, { json: values.json }),
  },
  {
    path: ['blocks', 'list'],
    usage: 'tahti blocks list [--json]',
    summary: 'List the accounts you have blocked',
    details: 'Calls GET /api/me/blocks, newest first (up to 500).',
    options: JSON_OPTION,
    run: (config, { values }) => runBlocksList(config, { json: values.json }),
  },
  {
    path: ['blocks', 'add'],
    usage: 'tahti blocks add <username>',
    summary: 'Block an account',
    details: `Calls POST /api/me/blocks. A blocked account cannot message you, mention
you or comment on your tracks, and the follows, loves, reposts and
collection subscriptions between you are removed. Blocking twice is fine.
Needs a token with the write scope.`,
    options: {},
    positionals: 1,
    run: (config, { positionals }) => runBlocksAdd(config, positionals[0]),
  },
  {
    path: ['blocks', 'remove'],
    usage: 'tahti blocks remove <username>',
    summary: 'Unblock an account',
    details: `Calls DELETE /api/me/blocks/:username. What the block removed (follows,
loves, reposts, subscriptions) does not come back. Needs a token with the
write scope.`,
    options: {},
    positionals: 1,
    run: (config, { positionals }) => runBlocksRemove(config, positionals[0]),
  },
  {
    path: ['mentions'],
    usage: 'tahti mentions [--limit <n>] [--json]',
    summary: 'List where other artists have @mentioned you',
    details: `Calls GET /api/me/mentions, newest first: who, in what (bio, announcement,
release, newsletter, tracklist, chat) and where.
  --limit <n>   How many, 1-${MAX_MENTIONS_LIMIT} (default: 20)`,
    options: { ...JSON_OPTION, limit: { type: 'string' } },
    run: (config, { values }) =>
      runMentions(config, { json: values.json, limit: values.limit }),
  },
  {
    path: ['messages', 'list'],
    usage: 'tahti messages list [--json]',
    summary: 'List your direct-message conversations',
    details: `Calls GET /api/me/messages/conversations: who, unread count, last update
and the start of the last message, plus the unread total. Listing does not
mark anything read.`,
    options: JSON_OPTION,
    run: (config, { values }) => runMessagesList(config, { json: values.json }),
  },
  {
    path: ['messages', 'send'],
    usage: 'tahti messages send <username> <message...>',
    summary: 'Send a direct message',
    details: `Finds or starts your conversation with <username> (POST
/api/me/messages/conversations), then sends the words after it as one
message (up to 2000 characters). Quote the message if it contains shell
characters. Needs a token with the write scope.`,
    options: {},
    positionals: Infinity,
    run: (config, { positionals }) =>
      runMessagesSend(config, positionals[0], positionals.slice(1)),
  },
  {
    path: ['feed'],
    usage: 'tahti feed [--limit <n>] [--json]',
    summary: 'Show recent posts, tracks and releases from artists you follow',
    details: `Calls GET /api/me/feed, newest first: the date, the artist, what it is
(post, track, or the release type) and its title or the start of the post.
  --limit <n>   Show only the first n items`,
    options: { ...JSON_OPTION, limit: { type: 'string' } },
    run: (config, { values }) =>
      runFeed(config, { json: values.json, limit: values.limit }),
  },
  {
    path: ['collections', 'list'],
    usage: 'tahti collections list [--json]',
    summary: 'List your collections (playlists, albums, mix series)',
    details: `Calls GET /api/me/collections, newest first: slug, name, type, visibility
and item count. Use the slug with \`tahti collections show\`.`,
    options: JSON_OPTION,
    run: (config, { values }) =>
      runCollectionsList(config, { json: values.json }),
  },
  {
    path: ['collections', 'show'],
    usage: 'tahti collections show <slug> [--json]',
    summary: 'Show one of your collections with its items',
    details: `Calls GET /api/me/collections/:slug. Get slugs from \`tahti collections list\`.
Items someone else has since made private are marked "no longer public".
--json includes the API's short-lived signed audio URLs; the table never does.`,
    options: JSON_OPTION,
    positionals: 1,
    run: (config, { values, positionals }) =>
      runCollectionsShow(config, positionals[0], { json: values.json }),
  },
  {
    path: ['collections', 'add'],
    usage:
      'tahti collections add <slug> [<sound-id>...] [--release <id>] [--json]',
    summary: 'Add tracks or a release to one of your collections',
    details: `Calls POST /api/me/collections/:slug/items once per item, appending each to
the end. Your own tracks must have finished processing; other artists'
tracks must be public; a release must be yours and published. An item that
is already there is reported, not added twice. Exits with 1 when any item
fails. Needs a token with the write scope.
  --release <id>   Also add one of your releases`,
    options: { ...JSON_OPTION, release: { type: 'string' } },
    positionals: Infinity,
    run: (config, { values, positionals }) =>
      runCollectionsAdd(config, positionals[0], positionals.slice(1), {
        release: values.release,
        json: values.json,
      }),
  },
  {
    path: ['collections', 'remove'],
    usage: 'tahti collections remove <slug> <#>',
    summary: 'Remove an item from one of your collections',
    details: `Removes the item at position <#> as numbered by \`tahti collections show\`
(DELETE /api/me/collections/:slug/items/:itemId). Removes it from the
collection only; the track or release itself stays. Needs a token with
the write scope.`,
    options: {},
    positionals: 2,
    run: (config, { positionals }) =>
      runCollectionsRemove(config, positionals[0], positionals[1]),
  },
  {
    path: ['channel'],
    usage: 'tahti channel [<slug>] [--json]',
    summary: 'Show whether a channel is live and what it plays',
    details: `Calls GET /api/channels/:slug (public; the token is not sent). With no slug,
first looks up your own channel with GET /api/auth/me. Prints the state
(and whether audio is coming in while live), now playing, up next, the
next scheduled broadcast, whether chat is on and the HLS stream URL.`,
    options: JSON_OPTION,
    positionals: 1,
    run: (config, { values, positionals }) =>
      runChannel(config, positionals[0], { json: values.json }),
  },
  {
    path: ['shell'],
    usage: 'tahti shell',
    summary: 'Interactive TUI: library, search, radio, queue (needs mpv)',
    details: `Opens a blessed terminal UI. Browse your library, search public tracks,
tune Tahti Radio / internet-radio presets, and manage a simple queue.
Playback uses an external mpv process (must be on PATH) over JSON IPC.
Requires a TTY and TAHTI_API_TOKEN. Keys: Tab focus, Enter play, Space
pause, n/p next/prev, ←/→ seek, / search, a queue, ? help, q quit.`,
    options: {},
    run: (config) => runShell(config),
  },
];

const ENVIRONMENT_HELP = `Environment:
  TAHTI_API_TOKEN   Personal API token (tahti.live → Settings → Account → API tokens).
                    Required by every command except search and
                    channel <slug>. Commands that change something (their
                    --help says so) need a token with the write scope.
                    hearthis download-set only needs read
                    (files are fetched from hearthis.at, not uploaded to Tahti).
                    shell needs a token for library playback.
  TAHTI_API_URL     API base URL (default: https://api.tahti.live)

External tools:
  mpv               Required for \`tahti shell\` playback (install separately).`;

function commandList() {
  const width = Math.max(...COMMANDS.map((command) => command.usage.length));
  return COMMANDS.map(
    (command) => `  ${command.usage.padEnd(width)}  ${command.summary}`,
  ).join('\n');
}

const HELP = `tahti-cli — terminal-first access to Tahti

Usage:
${commandList()}
  tahti <command> --help   Show help for one command
  tahti --help             Show this help

${ENVIRONMENT_HELP}
`;

function commandHelp(command) {
  const jsonHelp = command.options?.json
    ? '  --json           Print the raw API response as JSON\n'
    : '';
  return `Usage: ${command.usage}

${command.summary}.

${command.details}
${jsonHelp}  -h, --help       Show this help

${ENVIRONMENT_HELP}
`;
}

function isHelpFlag(arg) {
  return arg === '--help' || arg === '-h';
}

function findCommand(argv) {
  return COMMANDS.find((command) =>
    command.path.every((segment, index) => argv[index] === segment),
  );
}

function parseCommandArgs(command, args) {
  try {
    const parsed = parseArgs({
      args,
      options: command.options,
      allowPositionals: Boolean(command.positionals),
    });
    if (parsed.positionals.length > (command.positionals ?? 0)) {
      throw new CliError(
        `Unexpected argument: ${parsed.positionals[command.positionals ?? 0]}`,
      );
    }
    return parsed;
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
    throw new CliError(
      `${error.message}\nRun \`tahti ${command.path.join(' ')} --help\` for usage.`,
    );
  }
}

export async function main(argv) {
  if (argv.length === 0 || isHelpFlag(argv[0])) {
    console.log(HELP);
    return 0;
  }

  const command = findCommand(argv);
  if (!command) {
    const attempted = argv.filter((arg) => !arg.startsWith('-')).slice(0, 2);
    console.error(`Unknown command: ${attempted.join(' ') || argv[0]}\n`);
    console.error(HELP);
    return 1;
  }

  const args = argv.slice(command.path.length);
  if (args.some(isHelpFlag)) {
    console.log(commandHelp(command));
    return 0;
  }

  const parsed = parseCommandArgs(command, args);
  // A command returns its output, or `{ output, exitCode }` when it can
  // finish with something to show and still have failed (a partial import).
  const result = await command.run(resolveConfig(), parsed);
  if (typeof result === 'string') {
    if (result) {
      console.log(result);
    }
    return 0;
  }
  if (result.output) {
    console.log(result.output);
  }
  return result.exitCode;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error) => {
      if (error instanceof CliError) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error(error);
      }
      process.exit(1);
    });
}
