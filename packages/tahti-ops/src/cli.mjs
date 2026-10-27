#!/usr/bin/env node
import { parseArgs } from 'node:util';

import { runBackupStatus } from './commands/backup-status.mjs';
import {
  BASELINE_FILE,
  LINE_LIMIT,
  runCheckSize,
} from './commands/check-size.mjs';
import { deployTargets, runDeploy } from './commands/deploy.mjs';
import { desktopModes, runDesktop } from './commands/desktop.mjs';
import { runE2e } from './commands/e2e.mjs';
import { runEnv } from './commands/env.mjs';
import { runPackageAur } from './commands/package-aur.mjs';
import {
  runFlathubUpdate,
  runFlatpakSources,
} from './commands/package-flatpak.mjs';
import { runReleasePrepare } from './commands/release.mjs';
import {
  listSnapshots,
  snapshotGroups,
  updateSnapshots,
} from './commands/snapshots.mjs';
import { runStackSmoke } from './commands/stack-smoke.mjs';
import { runTests, testGroups } from './commands/test.mjs';
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
    path: ['release', 'prepare'],
    usage: 'tahti-ops release prepare <version> [--build] [--dry-run]',
    summary:
      'Bump the desktop version, update the metainfo, commit and tag player@<version>',
    details: `Runs packages/tools/src/prepare-release.mjs (same as pnpm release:prepare),
then prints the push command. Pushing the tag starts release-player.yml.
  --build     Also build the Tauri bundle locally afterwards
  --dry-run   Print each step without running it

Example:
  tahti-ops release prepare 1.48.0 --dry-run`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      const build = args.includes('--build');
      const rest = args.filter((arg) => arg !== '--build');
      const unknown = rest.find((arg) => arg.startsWith('-'));
      if (unknown) {
        throw new OpsError(`Unknown option: ${unknown}`);
      }
      return runReleasePrepare(rest[0], { dryRun, build });
    },
  },
  {
    path: ['deploy'],
    usage:
      'tahti-ops deploy <stack|worker|minio|all|web|storybook> [--dry-run] [flags]',
    summary:
      'Deploy the production stack, worker, MinIO, the web app (beta.tahti.live) or Storybook',
    details: `Targets:
  stack    compose stack on DEPLOY_HOST (vimage) — flags: --no-cache --down
  worker   remote transcode worker — flags: --bootstrap-env
  minio    remote MinIO node — flags: --bootstrap-env
  all      stack, then worker, then minio
  web      build tahti-web and ship it to beta.tahti.live (deploy-vimage.sh over SSH);
           --ci dispatches the self-hosted GitHub deploy workflow instead
  storybook  build Storybook and ship it to the Storybook host

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
  {
    path: ['package', 'flatpak'],
    usage:
      'tahti-ops package flatpak <sources [--out <dir>]|flathub <version>> [--dry-run]',
    summary:
      'Generate Flatpak dependency sources, or open the Flathub update PR for a release',
    details: `Actions:
  sources [--out <dir>]  Write pnpm-sources.json and cargo-sources.json
                         (default dir: packaging/flatpak, gitignored)
  flathub <version>      Clone flathub/live.tahti.player, regenerate sources, fill
                         live.tahti.player.yml.template for player@<version>, push a
                         branch and open a PR (needs GH_TOKEN). Run by update-flathub.yml.

Needs flatpak-node-generator and python3 (skipped on --dry-run).
  --dry-run   Print each step without running it`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      const { value: outDir, rest } = takeOption(args, '--out');
      const unknown = rest.find((arg) => arg.startsWith('-'));
      if (unknown) {
        throw new OpsError(`Unknown option: ${unknown}`);
      }
      if (rest[0] === 'sources') {
        return runFlatpakSources({ dryRun, outDir });
      }
      if (rest[0] === 'flathub') {
        return runFlathubUpdate(rest[1], { dryRun });
      }
      throw new OpsError(
        'Try: tahti-ops package flatpak sources | flathub <version>',
      );
    },
  },
];

const splitDryRun = (argv) => ({
  dryRun: argv.includes('--dry-run'),
  args: argv.filter((arg) => arg !== '--dry-run'),
});

function takeOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return { value: null, rest: args };
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new OpsError(`${name} needs a value`);
  }
  return { value, rest: [...args.slice(0, index), ...args.slice(index + 2)] };
}

COMMANDS.push(
  {
    path: ['desktop'],
    usage: 'tahti-ops desktop <run|launch|dev|bundle|android> [--dry-run]',
    summary:
      'Build and launch the desktop app, run it in dev mode, bundle it, or run it on Android',
    details: `Modes:
${Object.entries(desktopModes())
  .map(([mode, text]) => `  ${mode.padEnd(8)} ${text}`)
  .join('\n')}

Needs Rust and the Tauri system packages (see AGENTS.md → Environment).
android runs \`tauri android init\` first when src-tauri/gen/android is missing.`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      return runDesktop(args[0], { dryRun, extraArgs: args.slice(1) });
    },
  },
  {
    path: ['test'],
    usage: 'tahti-ops test [<group>…] [--dry-run] [-- <vitest args>]',
    summary: 'Run tests by group: web, ui, player, storybook, types, lint, all',
    details: `Groups (default: all):
${Object.entries(testGroups())
  .map(([name, group]) => `  ${name.padEnd(10)} ${group.summary}`)
  .join('\n')}

Arguments after -- go to the test runner, e.g.
  tahti-ops test web -- src/views/ListenView.test.tsx`,
    passthrough: true,
    allowEmpty: true,
    run: (_parsed, argv) => {
      const dashIndex = argv.indexOf('--');
      const own = dashIndex === -1 ? argv : argv.slice(0, dashIndex);
      const extraArgs = dashIndex === -1 ? [] : argv.slice(dashIndex + 1);
      const { dryRun, args } = splitDryRun(own);
      return runTests(args, { dryRun, extraArgs });
    },
  },
  {
    path: ['e2e'],
    usage:
      'tahti-ops e2e <journeys|tasks|playwright> [names…] [--env-file <path>] [--dry-run]',
    summary:
      'Run e2e: screenshot journeys, real-backend task journeys, Playwright specs',
    details: `Kinds:
  journeys [anonymous|listener|artist|admin]  Screenshot journeys on the mock app (starts a dev server)
  tasks <listener|artist>                     Task journeys against a real backend (default beta.tahti.live);
                                              needs TAHTI_E2E_* credentials, e.g. --env-file ~/.tahti-e2e.env
  playwright [spec…]                          Playwright specs in packages/tahti-web/e2e (PLAYWRIGHT_BASE_URL)

  --env-file <path>  Load KEY=value credentials for this run only`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      const { value: envFile, rest } = takeOption(args, '--env-file');
      return runE2e(rest[0], rest.slice(1), { dryRun, envFile });
    },
  },
  {
    path: ['package', 'aur'],
    usage: 'tahti-ops package aur <version> [--no-push] [--dry-run]',
    summary:
      'Publish tahti-player-bin <version> to the AUR (PKGBUILD + .SRCINFO)',
    details: `Hashes the released player@<version> .deb, renders
packaging/aur/tahti-player-bin/PKGBUILD.template, generates .SRCINFO with
makepkg (Arch only), then commits and pushes to the AUR repo over SSH.
Run by .github/workflows/update-aur.yml after a release.

  --no-push   Render and print PKGBUILD and .SRCINFO without touching the AUR
  --dry-run   Print each step without running it`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      const push = !args.includes('--no-push');
      const rest = args.filter((arg) => arg !== '--no-push');
      const unknown = rest.find((arg) => arg.startsWith('-'));
      if (unknown) {
        throw new OpsError(`Unknown option: ${unknown}`);
      }
      return runPackageAur(rest[0], { dryRun, push });
    },
  },
  {
    path: ['snapshots'],
    usage:
      'tahti-ops snapshots <list|update> [<group>…|all] [--only <test path>] [--dry-run]',
    summary:
      'List snapshot groups or re-record them (ui, player, hifi, surfaces)',
    details: `Groups: ${Object.keys(snapshotGroups()).join(', ')}, or all.
  list                   Snapshot files per group
  update <group…|all>    Re-record, then show which snapshot files changed
  --only <test path>     Limit to one test file (one group only)

A change in packages/ui often changes player snapshots too:
  tahti-ops snapshots update ui player`,
    passthrough: true,
    run: (_parsed, argv) => {
      const { dryRun, args } = splitDryRun(argv);
      const { value: only, rest } = takeOption(args, '--only');
      if (rest[0] === 'list') {
        return listSnapshots();
      }
      if (rest[0] === 'update') {
        return updateSnapshots(rest.slice(1), { dryRun, only });
      }
      throw new OpsError('Try: tahti-ops snapshots list | update <group…|all>');
    },
  },
  {
    path: ['check', 'size'],
    usage: 'tahti-ops check size [--update|--prune]',
    summary: `Fail when a source file over ${LINE_LIMIT} lines appears or grows`,
    details: `Scans packages/tahti-web/src, packages/player/src and src-tauri/src
(tests, stories, mocks and generated files excluded). Files already over the
limit are pinned in ${BASELINE_FILE} and may only shrink.
  --update   Rewrite the baseline to every file currently over the limit
  --prune    Drop pins for files now under the limit or gone`,
    options: {
      update: { type: 'boolean', default: false },
      prune: { type: 'boolean', default: false },
    },
    run: ({ values }) => {
      if (values.update && values.prune) {
        throw new OpsError('Use either --update or --prune, not both');
      }
      const mode = values.update ? 'update' : values.prune ? 'prune' : 'check';
      return runCheckSize({ mode });
    },
  },
);

const HELP = `tahti-ops — maintainer CLI (desktop, tests, e2e, snapshots, deploy, stack, env, backup)

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
      (args.length === 0 && !command.allowEmpty) ||
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
