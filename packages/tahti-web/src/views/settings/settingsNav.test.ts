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
      'general',
      'themes',
      'plugin-store',
      'whats-new',
    ]);
  });

  it('keeps an artist to account sections; the profile forms are in Studio', () => {
    expect(ids({ signedIn: true, hasChannel: true })).toEqual([
      'account',
      'security',
      'notifications',
      'playback',
      'general',
      'themes',
      'plugin-store',
      'whats-new',
    ]);
  });

  it('has no Logs section; client logs live in Admin → Logs', () => {
    expect(
      settingsNavFor({ signedIn: true, hasChannel: true }).map(
        (item) => item.id,
      ),
    ).not.toContain('logs');
  });

  it('gives a listener with no channel their Profile', () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: false });
    expect(nav.map((item) => item.id)).toEqual([
      'account',
      'security',
      'notifications',
      'artist',
      'playback',
      'general',
      'themes',
      'plugin-store',
      'whats-new',
    ]);
    expect(nav.find((item) => item.id === 'artist')?.label).toBe('Profile');
    expect(nav.find((item) => item.id === 'artist')?.labelKey).toBe(
      'settings.profile',
    );
  });

  it('gives no description to Account whose tabs already list their content', () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: true });
    expect(
      nav.find((item) => item.id === 'account')?.description,
    ).toBeUndefined();
    expect(
      settingsNavFor({ signedIn: true, hasChannel: false }).find(
        (item) => item.id === 'artist',
      )?.description,
    ).toBeUndefined();
    expect(
      nav.find((item) => item.id === 'security')?.description,
    ).toBeTruthy();
    expect(
      nav.find((item) => item.id === 'notifications')?.description,
    ).toBeTruthy();
    expect(
      nav.find((item) => item.id === 'playback')?.description,
    ).toBeTruthy();
  });

  it("labels General, Themes and What's new clearly", () => {
    const nav = settingsNavFor({ signedIn: true, hasChannel: true });
    expect(nav.find((item) => item.id === 'general')?.labelKey).toBe(
      'settings.general',
    );
    expect(nav.find((item) => item.id === 'themes')?.labelKey).toBe(
      'settings.themes',
    );
    expect(nav.find((item) => item.id === 'whats-new')?.labelKey).toBe(
      'settings.about',
    );
  });

  it('sends a deep link to an unavailable section somewhere that exists', () => {
    const artist = { signedIn: true, hasChannel: true };
    expect(isSettingsSectionAvailable('artist', artist)).toBe(false);
    expect(fallbackSettingsSection(artist)).toBe('account');
    const visitor = { signedIn: false, hasChannel: false };
    expect(isSettingsSectionAvailable('account', visitor)).toBe(false);
    expect(fallbackSettingsSection(visitor)).toBe('themes');
  });
});
