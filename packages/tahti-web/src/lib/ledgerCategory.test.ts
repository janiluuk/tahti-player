import { describe, expect, it } from 'vitest';

import { formatEuroCents, ledgerCategoryLabel } from './ledgerCategory';

describe('ledgerCategory', () => {
  it('names known ledger codes and words unknown ones', () => {
    expect(ledgerCategoryLabel('COST_INFRASTRUCTURE')).toBe(
      'Infrastructure costs',
    );
    expect(ledgerCategoryLabel('SOMETHING_NEW')).toBe('Something new');
  });

  it('formats cents as euros with thousands separators', () => {
    expect(formatEuroCents(420000)).toBe('€4,200.00');
  });
});
