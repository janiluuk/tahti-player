import { describe, expect, it } from 'vitest';

import { resolveDashboardRedirect } from './prodPathRedirects';

describe('resolveDashboardRedirect', () => {
  it.each([
    ['distribution', '/studio/distribution'],
    ['embeds', '/studio/releases'],
    ['events', '/studio/events'],
    ['venues', '/studio/venues'],
    ['recordings', '/library/recordings'],
    ['setup-channel', '/studio/channel?tab=setup'],
    ['channel/edit', '/studio/branding?tab=channel-designer'],
    ['settings/multistream', '/studio/channel?tab=multicast'],
    ['posts', '/studio/updates'],
    ['upload/from-broadcast', '/library/recordings'],
    ['archive/track-1/editor', '/studio/sounds/track-1/editor'],
    ['insights/archive/track-1', '/studio/insights/archive/track-1'],
    ['collections/new', '/studio/collections'],
    ['settings/media', '/settings/artist'],
    ['settings/presskit', '/studio/branding?tab=press-kit'],
    ['settings/branding', '/settings/artist'],
    ['settings/green-room', '/settings/broadcast'],
    ['settings/discovery', '/settings/widgets'],
    ['settings/internet-radio', '/settings/widgets'],
    ['settings/themes', '/settings/themes'],
    ['settings/moderators', '/studio/moderation'],
    ['settings/distribution', '/studio/distribution'],
    ['playlists', '/studio/collections'],
    ['messages', '/messages'],
  ])('maps /dashboard/%s to %s', (source, expected) => {
    expect(resolveDashboardRedirect(source)).toBe(expected);
  });
});
