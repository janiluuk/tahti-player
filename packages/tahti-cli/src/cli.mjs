#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { CliError, resolveConfig } from './api-client.mjs';
import { LIBRARY_SORTS, runLibraryList } from './commands/library-list.mjs';
import { runLibraryShow } from './commands/library-show.mjs';
import { runReleasesList } from './commands/releases-list.mjs';
import { runWhoami } from './commands/whoami.mjs';

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
];

const ENVIRONMENT_HELP = `Environment:
  TAHTI_API_TOKEN   Personal API token (tahti.live → Settings → Account → API tokens). Required.
  TAHTI_API_URL     API base URL (default: https://api.tahti.live)`;

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
  return `Usage: ${command.usage}

${command.summary}.

${command.details}
  --json           Print the raw API response as JSON
  -h, --help       Show this help

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
  const output = await command.run(resolveConfig(), parsed);
  console.log(output);
  return 0;
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
