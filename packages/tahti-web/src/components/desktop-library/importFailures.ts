import { basename } from './pathLabels';

const MAX_LISTED_IMPORT_FAILURES = 5;

export function describeImportFailures(
  errors: ReadonlyArray<{ path: string; error: string }>,
): string {
  const lines = errors
    .slice(0, MAX_LISTED_IMPORT_FAILURES)
    .map((failure) => `${basename(failure.path)}: ${failure.error}`);
  const remaining = errors.length - lines.length;
  if (remaining > 0) {
    lines.push(`…and ${remaining} more.`);
  }
  return lines.join('\n');
}
