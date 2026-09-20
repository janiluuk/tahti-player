#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { CliError, resolveConfig } from './api-client.mjs';
import { runLibraryList } from './commands/library-list.mjs';

const HELP = `tahti-cli — terminal-first access to Tahti

Usage:
  tahti library list [--json]     List your own library sounds
  tahti --help                    Show this help

Environment:
  TAHTI_API_TOKEN   Personal API token (tahti.live → Settings → Account → API tokens). Required.
  TAHTI_API_URL     API base URL (default: https://api.tahti.live)
`;

export async function main(argv) {
  const [command, subcommand, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    console.log(HELP);
    return 0;
  }

  if (command === 'library' && subcommand === 'list') {
    const { values } = parseArgs({
      args: rest,
      options: { json: { type: 'boolean', default: false } },
    });
    const config = resolveConfig();
    const output = await runLibraryList(config, { json: values.json });
    console.log(output);
    return 0;
  }

  console.error(
    `Unknown command: ${[command, subcommand].filter(Boolean).join(' ')}\n`,
  );
  console.error(HELP);
  return 1;
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
