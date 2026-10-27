import { describe, expect, it } from 'vitest';

import { buildSettingsPath } from './settingsUrl';

describe('buildSettingsPath', () => {
  it('builds a section path with no query', () => {
    expect(buildSettingsPath({ section: 'playback' })).toBe(
      '/settings/playback',
    );
  });

  it('adds artist and account tab query params', () => {
    expect(
      buildSettingsPath({ section: 'artist', artistSection: 'branding' }),
    ).toBe('/settings/artist?tab=branding');
    expect(
      buildSettingsPath({
        section: 'account',
        accountSection: 'api-tokens',
      }),
    ).toBe('/settings/account?tab=api-tokens');
    expect(
      buildSettingsPath({
        section: 'channel',
        channelSection: 'moderators',
      }),
    ).toBe('/settings/channel?tab=moderators');
  });

  it('adds plugin-store category and ignores mismatched sub-fields', () => {
    expect(
      buildSettingsPath({
        section: 'plugin-store',
        pluginCategory: 'import',
        artistSection: 'branding',
      }),
    ).toBe('/settings/plugin-store?category=import');
    expect(
      buildSettingsPath({
        section: 'themes',
        accountSection: 'subscriptions',
      }),
    ).toBe('/settings/themes');
  });
});
