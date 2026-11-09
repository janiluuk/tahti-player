import { webT } from '../../../lib/webT';

/** Pill colour for a cron run outcome: green when it succeeded, red for any
 * other outcome, cyan while it is still running (no outcome yet). */
export function cronOutcomeColor(
  outcome: string | null,
): 'green' | 'red' | 'cyan' {
  if (outcome === 'SUCCESS') {
    return 'green';
  }
  return outcome ? 'red' : 'cyan';
}

export function cronOutcomeLabel(outcome: string | null): string {
  const t = webT();
  if (!outcome) {
    return t('cronOutcome.running');
  }
  if (outcome === 'SUCCESS') {
    return t('cronOutcome.success');
  }
  if (outcome === 'ERROR' || outcome === 'FAILED' || outcome === 'FAILURE') {
    return t('cronOutcome.failed');
  }
  const words = outcome.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
