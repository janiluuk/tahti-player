import { describe, expect, it } from 'vitest';

import {
  fallbackSettingsSection,
  isSettingsSectionAvailable,
  settingsNavFor,
} from './settingsNav';

const ids = (audience: { signedIn: boolean; hasChannel: boolean }) =>
  settingsNavFor(audience).map((item) => item.id);

describe('settingsNavFor', () => {
  it('shows a visitor only the sections that need no account', () => {
    expect(ids({ signedIn: false, hasChannel: false })).toEqual([
      'playback',
      'themes',
      'plugin-store',
      'logs',
      'whats-new',
    ]);
  });

  it('shows an artist every section', () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: true });
    expect(nav.map((item) => item.id)).toContain('channel');
    expect(nav.map((item) => item.id)).toContain('broadcast');
    expect(nav.find((item) => item.id === 'artist')?.label).toBe('Artist');
  });

  it('hides the channel sections from a listener with no channel', () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: false });
    expect(nav.map((item) => item.id)).toEqual([
      'account',
      'artist',
      'playback',
      'integrations',
      'themes',
      'plugin-store',
      'logs',
      'whats-new',
    ]);
    expect(nav.find((item) => item.id === 'artist')?.label).toBe('Profile');
  });

  it('gives no description to sections whose tabs already list their content', () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: true });
    for (const id of ['account', 'artist', 'channel', 'broadcast']) {
      expect(nav.find((item) => item.id === id)?.description).toBeUndefined();
    }
    expect(
      nav.find((item) => item.id === 'playback')?.description,
    ).toBeTruthy();
  });

  it('sends a deep link to an unavailable section somewhere that exists', () => {
    const listener = { signedIn: true, hasChannel: false };
    expect(isSettingsSectionAvailable('broadcast', listener)).toBe(false);
    expect(fallbackSettingsSection(listener)).toBe('account');
    const visitor = { signedIn: false, hasChannel: false };
    expect(isSettingsSectionAvailable('account', visitor)).toBe(false);
    expect(fallbackSettingsSection(visitor)).toBe('themes');
  });
});
