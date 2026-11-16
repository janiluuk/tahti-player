import { movedProfileSettingsPath } from './studioProfileSections';

const MOVED_SETTINGS_SECTIONS = {
  audience: 'Audience',
  money: 'Money',
  'fan-subs': 'Fan subscriptions',
  'fan-tiers': 'Fan tiers',
} as const;

export type MovedSettingsSection = keyof typeof MOVED_SETTINGS_SECTIONS;

export function movedSettingsSection(
  value: unknown,
): MovedSettingsSection | undefined {
  return typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(MOVED_SETTINGS_SECTIONS, value)
    ? (value as MovedSettingsSection)
    : undefined;
}

export function movedSettingsSectionLabel(
  section: MovedSettingsSection,
): string {
  return MOVED_SETTINGS_SECTIONS[section];
}

/** Where a bookmark to a former Settings section lands in Studio. */
export function movedSettingsTarget(section: MovedSettingsSection): {
  to: '/studio/audience';
  search: { tab?: 'tiers'; movedFrom: MovedSettingsSection };
} {
  return {
    to: '/studio/audience',
    search: {
      ...(section === 'fan-tiers' ? { tab: 'tiers' as const } : {}),
      movedFrom: section,
    },
  };
}

/** Where a former Settings → Channel & chat or Broadcast link lands in
 * Studio, or null for a section that is still in Settings. Settings →
 * Artist stays for listeners, so `SettingsView` moves it only for an
 * account with a channel. */
export function movedStudioSettingsPath(
  section: string,
  tab: unknown,
): string | null {
  const tabId = typeof tab === 'string' ? tab : null;
  if (section === 'channel') {
    return movedProfileSettingsPath('channel', tabId);
  }
  if (section !== 'broadcast') {
    return null;
  }
  if (tabId === 'radio') {
    return '/studio/recordings#recording-settings';
  }
  if (tabId === 'multistream') {
    return '/studio/channel?radio=multicast#radio';
  }
  if (tabId === 'green-room') {
    return '/studio/channel#green-room';
  }
  return '/studio/channel';
}
