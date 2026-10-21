import type { AdminAddon } from '@tahti-web/api/admin';

export const ADMIN_ADDON = {
  id: 'addon-channel-stats',
  slug: 'channel-stats',
  scope: 'ARTIST',
  status: 'APPROVED',
  name: 'Channel stats',
  description: 'Shows the artist channel’s current listener statistics.',
  authorName: 'Tahti',
  categories: ['stats'],
  iconUrl: null,
  currentVersion: '1.2.0',
  bundleSizeBytes: 22100,
  moderationNote: null,
  defaultConfigJson: null,
  enabledByDefault: true,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
} satisfies AdminAddon;

export const ADMIN_ADDON_LIVE_STATUS = {
  ...ADMIN_ADDON,
  id: 'addon-live-status',
  slug: 'live-status',
  scope: 'ADMIN',
  name: 'Live status',
  description: 'Which channels are on air right now.',
  categories: ['status'],
} satisfies AdminAddon;

export const ADMIN_ADDON_SIGNUPS = {
  ...ADMIN_ADDON,
  id: 'addon-signups',
  slug: 'signups',
  scope: 'ADMIN',
  name: 'Signups today',
  description: 'New accounts in the last 24 hours.',
  categories: ['stats'],
} satisfies AdminAddon;
