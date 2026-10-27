import { describe, expect, it } from 'vitest';

import {
  movedSettingsSection,
  movedSettingsTarget,
} from './movedSettingsSections';

describe('movedSettingsSection', () => {
  it('recognises the Settings sections that moved to Studio', () => {
    expect(movedSettingsSection('money')).toBe('money');
    expect(movedSettingsSection('fan-tiers')).toBe('fan-tiers');
  });

  it('ignores sections that still live in Settings', () => {
    expect(movedSettingsSection('account')).toBeUndefined();
    expect(movedSettingsSection('toString')).toBeUndefined();
    expect(movedSettingsSection(undefined)).toBeUndefined();
  });
});

describe('movedSettingsTarget', () => {
  it('opens the tiers tab for a fan-tiers bookmark', () => {
    expect(movedSettingsTarget('fan-tiers')).toEqual({
      to: '/studio/audience',
      search: { tab: 'tiers', movedFrom: 'fan-tiers' },
    });
  });

  it('opens the audience overview for the other sections', () => {
    expect(movedSettingsTarget('money')).toEqual({
      to: '/studio/audience',
      search: { movedFrom: 'money' },
    });
  });
});
