#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { CliError, resolveConfig } from './api-client.mjs';
import { runHearthisDownloadSet } from './commands/hearthis-download-set.mjs';
import { runHearthisSet } from './commands/hearthis-set.mjs';
import { runHearthisSets } from './commands/hearthis-sets.mjs';
import { runImport } from './commands/import.mjs';
import { LIBRARY_SORTS, runLibraryList } from './commands/library-list.mjs';
import { runLibraryShow } from './commands/library-show.mjs';
import { runReleasesList } from './commands/releases-list.mjs';
import { runReleasesShow } from './commands/releases-show.mjs';
import { runSearch, SEARCH_PAGE_SIZE } from './commands/search.mjs';
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
                    Required by every command except search; import needs
                    the write scope. hearthis download-set only needs read
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
