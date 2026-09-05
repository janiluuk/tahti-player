/**
 * Sticky PR comment for Vitest snapshot digest.
 * Expects SNAPSHOT_DIGEST_MD env (path) and GITHUB_* from Actions.
 */
import { readFileSync, existsSync } from 'node:fs';

const MARKER = '<!-- tahti-snapshot-digest -->';

export default async function commentSnapshotDigest({ github, context, core }) {
  if (context.eventName !== 'pull_request') {
    core.info('Not a pull_request event; skipping snapshot digest comment');
    return;
  }

  const digestPath =
    process.env.SNAPSHOT_DIGEST_MD || 'snapshot-digest/digest.md';
  if (!existsSync(digestPath)) {
    core.warning(`No digest at ${digestPath}`);
    return;
  }

  const digestMd = readFileSync(digestPath, 'utf8').trim();
  const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
  const body = [
    MARKER,
    digestMd,
    '',
    `Artifacts: [snapshot-digest for this run](${runUrl}#artifacts)`,
    '',
    `_Updated from ${context.workflow} / ${context.job} @ \`${context.sha.slice(0, 7)}\`._`,
  ].join('\n');

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    per_page: 100,
  });

  const existing = comments.find((comment) =>
    String(comment.body ?? '').includes(MARKER),
  );

  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
    core.info(`Updated snapshot digest comment ${existing.id}`);
    return;
  }

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body,
  });
  core.info('Created snapshot digest comment');
}
