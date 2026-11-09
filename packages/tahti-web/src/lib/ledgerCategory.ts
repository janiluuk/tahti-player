import { toBcp47 } from '@tahti-player/i18n';

import { currentLocale } from './locale';
import { webT } from './webT';

const KNOWN = new Set([
  'REVENUE_SUBSCRIPTION',
  'REVENUE_DISTRIBUTION',
  'REVENUE_GRANT_INBOUND',
  'REVENUE_DONATION',
  'COST_INFRASTRUCTURE',
  'COST_DISTRIBUTION_PASSTHROUGH',
  'COST_OPERATIONS',
  'COST_SALARY',
  'COST_AUDIT',
  'COST_PROFESSIONAL_SERVICES',
  'GRANT_DISBURSEMENT',
  'RESERVE_TRANSFER',
]);

/** Readable name of a ledger category code, e.g. COST_INFRASTRUCTURE →
 * "Infrastructure costs". Unknown codes fall back to the code in words. */
export function ledgerCategoryLabel(category: string): string {
  if (KNOWN.has(category)) {
    return webT()(`ledgerCategory.${category}` as never);
  }
  const words = category.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Euro amount from cents in the app language's number style
 * (en: €4,200.00 · fi: 4 200,00 €). */
export function formatEuroCents(cents: number): string {
  return new Intl.NumberFormat(toBcp47(currentLocale()), {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}
