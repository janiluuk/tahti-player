import { describe, expect, it } from 'vitest';

import {
  ADMIN_RADIO_TABS,
  adminRadioTabFromSearch,
  isAdminRadioTabId,
} from './adminRadioTabs';

describe('adminRadioTabs', () => {
  it('lists Feature · Presets · Opt-outs · History', () => {
    expect(ADMIN_RADIO_TABS).toEqual([
      'feature',
      'presets',
      'opt-outs',
      'history',
    ]);
  });

  it('defaults unknown search to feature', () => {
    expect(adminRadioTabFromSearch(undefined)).toBe('feature');
    expect(adminRadioTabFromSearch('presets')).toBe('presets');
    expect(isAdminRadioTabId('opt-outs')).toBe(true);
    expect(isAdminRadioTabId('multicast')).toBe(false);
  });
});
