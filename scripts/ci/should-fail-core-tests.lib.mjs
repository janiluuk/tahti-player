/**
 * Pure classification for the core-test soft-pass gate.
 * @param {{ newCount: number | null, standingCount: number, snapshotFailures: number, otherFailures: number }} input
 * @returns {{ softPass: boolean, message: string }}
 */
export function classifyCoreTestGate({
  newCount,
  standingCount,
  snapshotFailures,
  otherFailures,
}) {
  if (otherFailures > 0) {
    return {
      softPass: false,
      message: `Hard fail: ${otherFailures} non-snapshot test failure(s) across packages.`,
    };
  }

  if (snapshotFailures === 0 && newCount === null) {
    return {
      softPass: false,
      message:
        'Hard fail: Test step failed but no snapshot digest / run summaries were collected.',
    };
  }

  if (newCount === 0 && (standingCount > 0 || snapshotFailures > 0)) {
    return {
      softPass: true,
      message: `Soft pass: ${standingCount || snapshotFailures} snapshot mismatch(es) already on master (newCount=0); no other failures.`,
    };
  }

  if (newCount != null && newCount > 0) {
    return {
      softPass: false,
      message: `Hard fail: ${newCount} new snapshot mismatch(es) in this PR (see digest).`,
    };
  }

  return {
    softPass: false,
    message:
      'Hard fail: Test step failed without a standing-only snapshot case.',
  };
}
