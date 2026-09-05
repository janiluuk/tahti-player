import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Vitest 4 reporter: write snapshot mismatches for the CI digest job.
 * Output: <package>/snapshot-digest/failures.json
 */
export default class SnapshotDigestReporter {
  onTestRunEnd(testModules = []) {
    if (!process.env.CI) {
      return;
    }

    const failures = [];
    for (const testModule of testModules) {
      const tests =
        testModule?.children?.allTests?.() ??
        testModule?.children?.tests?.() ??
        [];
      for (const testCase of tests) {
        const result =
          typeof testCase.result === 'function'
            ? testCase.result()
            : testCase.result;
        if (!result || result.state !== 'failed') {
          continue;
        }
        const errors = result.errors ?? [];
        for (const error of errors) {
          const message = String(
            error?.message ?? error?.stack ?? error ?? '',
          );
          if (!isSnapshotMismatch(message)) {
            continue;
          }
          const { expected, received } = extractExpectedReceived(
            error,
            message,
          );
          failures.push({
            file:
              testModule.moduleId ??
              testModule.filepath ??
              testCase.module?.moduleId ??
              'unknown',
            testName:
              testCase.fullName ??
              testCase.name ??
              'unknown',
            message: stripAnsi(message).slice(0, 20_000),
            expectedHtml: expected,
            receivedHtml: received,
          });
        }
      }
    }

    if (failures.length === 0) {
      return;
    }

    const outDir = path.join(process.cwd(), 'snapshot-digest');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      path.join(outDir, 'failures.json'),
      JSON.stringify(
        {
          packageName: path.basename(process.cwd()),
          cwd: process.cwd(),
          failures,
        },
        null,
        2,
      ),
    );
  }
}

function isSnapshotMismatch(message) {
  return (
    /Snapshot .*mismatched/i.test(message) ||
    (/toMatchSnapshot/i.test(message) && /Expected|Received/i.test(message))
  );
}

function extractExpectedReceived(error, message) {
  if (typeof error?.expected === 'string' || typeof error?.actual === 'string') {
    return {
      expected: normalizeHtmlCandidate(error.expected),
      received: normalizeHtmlCandidate(error.actual),
    };
  }

  const cleaned = stripAnsi(message);
  const expected = sliceBlock(
    cleaned,
    /(?:- Expected|\bExpected:)/i,
    /(?:\+ Received|\bReceived:)/i,
  );
  const received = sliceBlock(cleaned, /(?:\+ Received|\bReceived:)/i, null);
  return {
    expected: normalizeHtmlCandidate(expected),
    received: normalizeHtmlCandidate(received),
  };
}

function sliceBlock(text, startRe, endRe) {
  const startMatch = startRe.exec(text);
  if (!startMatch) {
    return null;
  }
  const from = startMatch.index + startMatch[0].length;
  let to = text.length;
  if (endRe) {
    const rest = text.slice(from);
    const endMatch = endRe.exec(rest);
    if (endMatch) {
      to = from + endMatch.index;
    }
  }
  return text.slice(from, to).trim();
}

function normalizeHtmlCandidate(value) {
  if (value == null) {
    return null;
  }
  let text = String(value).trim();
  if (!text) {
    return null;
  }

  const lines = text.split('\n').map((line) => {
    if (/^[+\-]\s?/.test(line) && !/^---|\+\+\+|@@/.test(line)) {
      return line.replace(/^[+\-]\s?/, '');
    }
    return line;
  });

  text = lines.join('\n').trim();
  if (text.startsWith('`') && text.endsWith('`')) {
    text = text.slice(1, -1);
  }
  return text || null;
}

function stripAnsi(value) {
  return String(value).replace(
    // eslint-disable-next-line no-control-regex
    /\u001B\[[0-9;]*m/g,
    '',
  );
}
