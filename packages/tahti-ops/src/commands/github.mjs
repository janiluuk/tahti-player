import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { playerRoot } from '../paths.mjs';

const SCRIPT = 'scripts/close-external-issue.cjs';
const WORKFLOW = '.github/workflows/close-external-issues.yml';

/** Validate the external-issue closer used by close-external-issues.yml. */
export function runGithubCloseExternalIssue({ dryRun = false } = {}) {
  const root = playerRoot();
  const scriptPath = resolve(root, SCRIPT);
  const workflowPath = resolve(root, WORKFLOW);
  const lines = [
    'GitHub Action callback for unsolicited issues (not runnable locally without github + context).',
    `Script: ${SCRIPT}`,
    `Workflow: ${WORKFLOW}`,
    'Deploy: actions/github-script loads the script on issues.opened.',
  ];
  if (dryRun) {
    return { exitCode: 0, output: `dry-run: ${lines.join('\n')}` };
  }
  readFileSync(scriptPath, 'utf8');
  readFileSync(workflowPath, 'utf8');
  return { exitCode: 0, output: lines.join('\n') };
}
