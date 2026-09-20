#!/usr/bin/env node
/**
 * Publishes this run's visual-snapshot PNGs (expected/received/diff) to a
 * dedicated orphan branch (`visual-snapshot-diffs`) so they're reachable
 * via raw.githubusercontent.com and can be embedded directly in the PR
 * comment -- no external image host, bucket, or extra credentials needed.
 *
 * Uses a separate `git worktree` so the main checkout (mid-CI-run, on the
 * PR's actual branch) is never touched. Retries on push rejection (another
 * PR's run publishing concurrently to the same shared branch) by re-fetching
 * and reapplying, rather than force-pushing over it and losing that PR's
 * diffs.
 *
 * Env: PR_NUMBER (required), GITHUB_SHA (optional, for the commit message).
 */
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SNAPSHOT_DIR = path.join(ROOT, 'snapshot-digest');
const BRANCH = 'visual-snapshot-diffs';
const WORKTREE_DIR = path.join(ROOT, '.visual-snapshot-worktree');
const MAX_ATTEMPTS = 3;

const prNumber = process.env.PR_NUMBER;

function git(args, opts = {}) {
  return execFileSync('git', args, {
    cwd: opts.cwd ?? ROOT,
    encoding: 'utf8',
    stdio: opts.quiet ? 'pipe' : 'inherit',
  });
}

function removeWorktree() {
  try {
    git(['worktree', 'remove', '--force', WORKTREE_DIR], { quiet: true });
  } catch {
    // Not registered as a worktree (first run, or already cleaned up) -- fine.
  }
  rmSync(WORKTREE_DIR, { recursive: true, force: true });
}

function listOpenPrNumbers() {
  try {
    const raw = execFileSync(
      'gh',
      ['pr', 'list', '--state', 'open', '--json', 'number', '--limit', '500'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    return new Set(JSON.parse(raw).map((pr) => String(pr.number)));
  } catch (error) {
    console.warn(
      `publish-visual-snapshot-diffs: could not list open PRs, skipping prune: ${error.message}`,
    );
    return null;
  }
}

function buildWorktree() {
  git(['fetch', 'origin'], { quiet: true });

  let branchExists = true;
  try {
    git(['rev-parse', '--verify', `origin/${BRANCH}`], { quiet: true });
  } catch {
    branchExists = false;
  }

  removeWorktree();

  if (branchExists) {
    git(['worktree', 'add', '--detach', WORKTREE_DIR, `origin/${BRANCH}`]);
    git(['checkout', '-B', BRANCH], { cwd: WORKTREE_DIR });
  } else {
    git(['worktree', 'add', '--detach', WORKTREE_DIR, 'HEAD']);
    git(['checkout', '--orphan', BRANCH], { cwd: WORKTREE_DIR });
    git(['rm', '-rf', '.'], { cwd: WORKTREE_DIR, quiet: true });
  }
}

function applyChanges(pngFiles, openPrNumbers) {
  if (openPrNumbers) {
    for (const entry of readdirSync(WORKTREE_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === '.git') {
        continue;
      }
      const match = /^pr-(\d+)$/.exec(entry.name);
      if (match && !openPrNumbers.has(match[1])) {
        rmSync(path.join(WORKTREE_DIR, entry.name), {
          recursive: true,
          force: true,
        });
      }
    }
  }

  const targetDir = path.join(WORKTREE_DIR, `pr-${prNumber}`);
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  for (const file of pngFiles) {
    copyFileSync(path.join(SNAPSHOT_DIR, file), path.join(targetDir, file));
  }
}

function commitAndPush() {
  git(['add', '-A'], { cwd: WORKTREE_DIR });
  const status = git(['status', '--porcelain'], {
    cwd: WORKTREE_DIR,
    quiet: true,
  });
  if (!status.trim()) {
    console.log('publish-visual-snapshot-diffs: no changes to publish');
    return true;
  }

  const sha = process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown';
  git(
    [
      '-c',
      'user.name=github-actions[bot]',
      '-c',
      'user.email=github-actions[bot]@users.noreply.github.com',
      'commit',
      '-m',
      `Visual snapshot diffs for PR #${prNumber} @ ${sha}`,
    ],
    { cwd: WORKTREE_DIR },
  );

  try {
    git(['push', 'origin', `HEAD:${BRANCH}`], { cwd: WORKTREE_DIR });
    return true;
  } catch (error) {
    console.warn(
      `publish-visual-snapshot-diffs: push rejected, will retry: ${error.message}`,
    );
    return false;
  }
}

function main() {
  if (!prNumber) {
    console.log('publish-visual-snapshot-diffs: no PR_NUMBER, skipping');
    return;
  }
  if (!existsSync(SNAPSHOT_DIR)) {
    console.log(
      'publish-visual-snapshot-diffs: no snapshot-digest dir, skipping',
    );
    return;
  }
  const pngFiles = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith('.png'));
  if (pngFiles.length === 0) {
    console.log('publish-visual-snapshot-diffs: no PNGs, skipping');
    return;
  }

  const openPrNumbers = listOpenPrNumbers();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    buildWorktree();
    applyChanges(pngFiles, openPrNumbers);
    if (commitAndPush()) {
      console.log(
        `publish-visual-snapshot-diffs: published ${pngFiles.length} file(s) to ${BRANCH}/pr-${prNumber}`,
      );
      break;
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        `publish-visual-snapshot-diffs: gave up after ${MAX_ATTEMPTS} attempts`,
      );
    }
  }

  removeWorktree();
}

main();
