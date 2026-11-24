import { describe, expect, it } from 'vitest';

import {
  movedSettingsSection,
  movedSettingsTarget,
  movedStudioSettingsPath,
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

describe('movedStudioSettingsPath', () => {
  it.each([
    ['channel', undefined, '/studio/channel/design'],
    ['channel', 'discovery', '/studio/channel/visibility'],
    ['channel', 'domain', '/studio/channel/address'],
    ['channel', 'channel-designer', '/studio/channel/design'],
    ['channel', 'moderators', '/studio/chat?section=moderators'],
    ['channel', 'chat', '/studio/chat'],
    ['broadcast', undefined, '/studio/channel/radio'],
    ['broadcast', 'radio', '/studio/recordings#recording-settings'],
    ['broadcast', 'green-room', '/studio/go-live?step=green-room'],
    ['broadcast', 'multistream', '/studio/go-live?step=destinations'],
  ])('sends /settings/%s?tab=%s to %s', (section, tab, path) => {
    expect(movedStudioSettingsPath(section, tab)).toBe(path);
  });

  it('leaves the sections that are still in Settings alone', () => {
    expect(movedStudioSettingsPath('artist', 'identity')).toBeNull();
    expect(movedStudioSettingsPath('account', undefined)).toBeNull();
  });
});
