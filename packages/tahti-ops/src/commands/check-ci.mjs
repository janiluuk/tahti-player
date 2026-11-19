import { playerRoot } from '../paths.mjs';
import { runProgram, runSteps } from '../run-script.mjs';

/** Same gate as CI before merge: ESLint, Prettier, TypeScript. */
export function runCheckCi({ dryRun = false } = {}) {
  const root = playerRoot();
  return runSteps(
    [
      ({ dryRun: dry }) =>
        runProgram('pnpm', ['lint'], {
          dryRun: dry,
          cwd: root,
          label: 'ci lint',
        }),
      ({ dryRun: dry }) =>
        runProgram('pnpm', ['exec', 'prettier', '--check', '.'], {
          dryRun: dry,
          cwd: root,
          label: 'ci format',
        }),
      ({ dryRun: dry }) =>
        runProgram('pnpm', ['type-check'], {
          dryRun: dry,
          cwd: root,
          label: 'ci type-check',
        }),
    ],
    { dryRun },
  );
}
