#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { runBackupStatus } from './commands/backup-status.mjs';
import { deployTargets, runDeploy } from './commands/deploy.mjs';
import { runEnv } from './commands/env.mjs';
import { runStackSmoke } from './commands/stack-smoke.mjs';
import { OpsError } from './paths.mjs';

const ENVIRONMENT_HELP = `Environment:
  TAHTI_ORG_ROOT   Path to the tahti-org checkout (default: ../tahti-org from this monorepo)
  DEPLOY_HOST      SSH host for env / deploy stack (default: vimage; use local for this machine)
  DEPLOY_PATH      Project path on the host (default: /srv/tahti)`;

const COMMANDS = [
  {
    path: ['env'],
    usage: 'tahti-ops env [<args…>] [--dry-run]',
    summary: 'Read or change production stack.env overrides on the deploy host',
    details: `Preferred entry for stack.env on the deploy host.

Examples:
  tahti-ops env list
  tahti-ops env get RATE_LIMIT_AUTH_MAX
  tahti-ops env set RATE_LIMIT_AUTH_MAX=600 --apply
  tahti-ops env preset ratelimit-loose --dry-run`,
    passthrough: true,
    run: (_parsed, argv) => {
      const dryRun = argv.includes('--dry-run');
      const args = argv.filter((arg) => arg !== '--dry-run');
      return runEnv(args, { dryRun });
    },
  },
  {
    path: ['stack', 'smoke'],
    usage: 'tahti-ops stack smoke [--dry-run]',
    summary:
      'Bring up the Docker stack and probe API, web, and browser surfaces',
    details: `Long-running local compose smoke (needs Docker).
  --dry-run   Print the action without running it`,
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
    run: ({ values }) => runStackSmoke({ dryRun: Boolean(values['dry-run']) }),
  },
  {
    path: ['backup', 'status'],
    usage: 'tahti-ops backup status [--dry-run]',
    summary: 'Show latest Postgres/MinIO backup ages',
    details: `For monitoring / cron checks.
  --dry-run   Print the action without running it`,
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
    run: ({ values }) =>
      runBackupStatus({ dryRun: Boolean(values['dry-run']) }),
  },
  {
    path: ['deploy'],
    usage:
      'tahti-ops deploy <stack|worker|minio|all> [--dry-run] [script flags]',
    summary:
      'Deploy production stack, remote worker, remote MinIO, or all three',
    details: `Targets:
  stack    compose stack on DEPLOY_HOST (vimage) — flags: --no-cache --down
  worker   remote transcode worker — flags: --bootstrap-env
  minio    remote MinIO node — flags: --bootstrap-env
  all      stack, then worker, then minio

  --dry-run   Print each step without running it`,
    passthrough: true,
    run: (_parsed, argv) => {
      const dryRun = argv.includes('--dry-run');
      const args = argv.filter((arg) => arg !== '--dry-run');
      const target = args[0];
      if (!target) {
        throw new OpsError(
          `Missing deploy target (try: all, ${deployTargets().join(', ')})`,
        );
      }
      return runDeploy(target, {
        dryRun,
        extraArgs: args.slice(1),
      });
    },
  },
];

const HELP = `tahti-ops — maintainer CLI (stack, env, backup, deploy)

Usage:
  tahti-ops <command> [options]

Commands:
${formatCommandList()}

Product API/TUI: \`tahti\` (@tahti-player/tahti-cli).

${ENVIRONMENT_HELP}
`;

function formatCommandList() {
  const width = Math.max(...COMMANDS.map((command) => command.usage.length));
  return COMMANDS.map(
    (command) => `  ${command.usage.padEnd(width)}  ${command.summary}`,
  ).join('\n');
}

function commandHelp(command) {
  return `Usage: ${command.usage}

${command.summary}.

${command.details}

  -h, --help       Show this help

${ENVIRONMENT_HELP}
`;
}

function isHelpFlag(arg) {
  return arg === '--help' || arg === '-h';
}

function findCommand(argv) {
  const ranked = COMMANDS.filter((command) =>
    command.path.every((segment, index) => argv[index] === segment),
  );
  return ranked.sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}

function parseCommandArgs(command, args) {
  try {
    return parseArgs({
      args,
      options: command.options ?? {},
      allowPositionals: false,
      strict: true,
    });
  } catch (error) {
    throw new OpsError(
      `${error.message}\nRun \`tahti-ops ${command.path.join(' ')} --help\` for usage.`,
    );
  }
}

function printResult(result) {
  if (result.output) {
    console.log(result.output);
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
  if (args.some(isHelpFlag) && !command.passthrough) {
    console.log(commandHelp(command));
    return 0;
  }

  if (command.passthrough) {
    if (
      args.length === 0 ||
      (args.length === 1 && isHelpFlag(args[0])) ||
      (command.path[0] === 'deploy' && args.some(isHelpFlag))
    ) {
      console.log(commandHelp(command));
      return 0;
    }
    const result = await command.run(null, args);
    printResult(result);
    return result.exitCode;
  }

  const parsed = parseCommandArgs(command, args);
  const result = await command.run(parsed);
  printResult(result);
  return result.exitCode;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((error) => {
      if (error instanceof OpsError) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error(error);
      }
      process.exit(1);
    });
}
