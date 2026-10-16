import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classifyCoreTestGate } from './should-fail-core-tests.lib.mjs';

describe('classifyCoreTestGate', () => {
  it('soft-passes standing-only snapshot debt (newCount 0)', () => {
    const result = classifyCoreTestGate({
      newCount: 0,
      standingCount: 3,
      snapshotFailures: 3,
      otherFailures: 0,
    });
    assert.equal(result.softPass, true);
    assert.match(result.message, /Soft pass/);
    assert.match(result.message, /newCount=0/);
  });

  it('soft-passes when standingCount is 0 but snapshotFailures > 0 and newCount 0', () => {
    const result = classifyCoreTestGate({
      newCount: 0,
      standingCount: 0,
      snapshotFailures: 2,
      otherFailures: 0,
    });
    assert.equal(result.softPass, true);
  });

  it('hard-fails on new snapshot mismatches', () => {
    const result = classifyCoreTestGate({
      newCount: 1,
      standingCount: 2,
      snapshotFailures: 3,
      otherFailures: 0,
    });
    assert.equal(result.softPass, false);
    assert.match(result.message, /Hard fail.*new snapshot/);
  });

  it('hard-fails on non-snapshot failures even when newCount is 0', () => {
    const result = classifyCoreTestGate({
      newCount: 0,
      standingCount: 1,
      snapshotFailures: 1,
      otherFailures: 1,
    });
    assert.equal(result.softPass, false);
    assert.match(result.message, /non-snapshot/);
  });

  it('hard-fails when the digest is missing and there are no snapshot summaries', () => {
    const result = classifyCoreTestGate({
      newCount: null,
      standingCount: 0,
      snapshotFailures: 0,
      otherFailures: 0,
    });
    assert.equal(result.softPass, false);
    assert.match(result.message, /no snapshot digest/);
  });
});
