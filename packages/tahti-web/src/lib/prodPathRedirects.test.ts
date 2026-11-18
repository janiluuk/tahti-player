import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_REDIRECTS,
  resolveDashboardRedirect,
} from './prodPathRedirects';

/** Addresses that only redirect somewhere else; a legacy link should land
 * on the final page in one hop. */
const REDIRECT_ONLY = [
  /^\/studio\/branding\b/,
  /^\/studio\/venues\b/,
  /^\/studio\/moderation\b/,
  /^\/studio\/revenue\b/,
  /^\/studio\/governance\b/,
  /^\/studio\/stash\b/,
  /^\/settings\/(artist|channel|broadcast|language|integrations)\b/,
  /^\/settings\/account\?tab=(password-email|devices|two-factor|api-tokens|notifications|mentions|governance)/,
  /^\/library\/(sounds|collections|upload|smartlinks|media|stash|local|embeds|recordings|releases)\b/,
];

describe('resolveDashboardRedirect', () => {
  it.each([
    ['distribution', '/studio/distribution'],
    ['embeds', '/studio/releases'],
    ['events', '/studio/schedule?show=events'],
    ['venues', '/venues/mine'],
    ['recordings', '/studio/recordings'],
    ['setup-channel', '/studio/channel'],
    ['channel/edit', '/studio/profile/appearance'],
    ['settings/multistream', '/studio/channel?radio=multicast#radio'],
    ['posts', '/studio/updates'],
    ['upload/from-broadcast', '/studio/recordings'],
    ['archive/track-1/editor', '/studio/sounds/track-1/editor'],
    ['insights/archive/track-1', '/studio/insights/archive/track-1'],
    ['collections/new', '/studio/collections'],
    ['settings/media', '/studio/profile/branding'],
    ['settings/presskit', '/studio/profile/press-kit'],
    ['settings/branding', '/studio/profile/branding'],
    ['settings/green-room', '/studio/channel#green-room'],
    ['upload', '/studio/upload'],
    ['settings/connections', '/studio/profile/connections'],
    ['settings/members', '/studio/profile/people'],
    ['settings/notifications', '/settings/notifications'],
    ['moderate/chat', '/studio/fans?tab=chat'],
    ['settings/api', '/settings/security?tab=api-tokens'],
    ['settings/discovery', '/studio/profile/discovery'],
    ['settings/internet-radio', '/settings/plugin-store?category=radio'],
    ['settings/themes', '/settings/themes'],
    ['settings/moderators', '/studio/fans?tab=chat&section=moderators'],
    ['settings/distribution', '/studio/channel?radio=tahti-radio#radio'],
    ['playlists', '/studio/collections'],
    ['messages', '/messages'],
    ['messages/conv-1', '/messages/conv-1'],
    ['messages/conv-1/', '/messages/conv-1'],
    ['sound', '/studio/sounds'],
    ['sound/track-1', '/studio/sounds/track-1'],
  ])('maps /dashboard/%s to %s', (source, expected) => {
    expect(resolveDashboardRedirect(source)).toBe(expected);
  });

  it.each(Object.entries(DASHBOARD_REDIRECTS))(
    '/dashboard/%s lands on a page, not on another redirect',
    (_source, target) => {
      for (const pattern of REDIRECT_ONLY) {
        expect(target).not.toMatch(pattern);
      }
    },
  );
});
