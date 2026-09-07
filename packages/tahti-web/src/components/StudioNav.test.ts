import { describe, expect, it } from 'vitest';

import {
  BROADCAST_SUBNAV_ITEMS,
  getStudioPrimaryRoute,
  getStudioSubmenuItems,
  isBroadcastSubnavActive,
  litStudioSubmenuDestinations,
  SUBMENUS,
} from './StudioNav';

describe('StudioNav section coverage', () => {
  // A submenu link whose own path doesn't resolve back to the primary
  // section it lives under falls back to StudioNavigation's '/studio'
  // default: landing on that page highlights no top-level tab and no
  // submenu item, even though the page renders a real subtabs bar. This
  // caught /studio/branding shipping unregistered.
  for (const [section, items] of Object.entries(SUBMENUS)) {
    for (const item of items) {
      it(`"${item.to}" (under ${section}) resolves back to ${section}`, () => {
        expect(getStudioPrimaryRoute(item.to)).toBe(section);
      });
    }
  }

  it('keeps multicast under Radio instead of a Broadcast sibling', () => {
    const destinations = BROADCAST_SUBNAV_ITEMS.map((item) => item.to);
    expect(destinations).not.toContain('/studio/channel?tab=multicast');
    expect(destinations).toContain('/studio/channel?tab=radio');
  });

  it('keeps Library out of the crowded Studio submenu (it has its own main-menu entry)', () => {
    expect(SUBMENUS).not.toHaveProperty('/library');
    const destinations = SUBMENUS['/studio'].map((item) => item.to);
    expect(destinations).not.toEqual(
      expect.arrayContaining([
        '/library',
        '/library/sounds',
        '/library/collections',
        '/library/upload',
      ]),
    );
    expect(destinations).toEqual(
      expect.arrayContaining([
        '/studio/releases',
        '/studio/editor',
        '/studio/go-live',
      ]),
    );
    expect(getStudioPrimaryRoute('/studio/releases')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/go-live')).toBe('/studio');
  });

  it('lights exactly one Studio submenu item on covered catalog routes, folding Perform/go-live pages into the single Broadcast tab', () => {
    const covered: [string, string][] = [
      ['/studio', '/studio'],
      ['/studio/branding', '/studio/branding'],
      ['/studio/setup-channel', '/studio/branding'],
      ['/studio/stats', '/studio/stats'],
      ['/studio/insights', '/studio/stats'],
      ['/studio/editor', '/studio/editor'],
      ['/studio/mastering/arch-1', '/studio/editor'],
      ['/studio/releases', '/studio/releases'],
      ['/studio/distribution', '/studio/releases'],
      ['/studio/go-live', '/studio/go-live'],
      ['/studio/info', '/studio/go-live'],
      ['/studio/schedule', '/studio/go-live'],
      ['/studio/events', '/studio/go-live'],
      ['/studio/events/new', '/studio/go-live'],
      ['/studio/shows', '/studio/go-live'],
      ['/studio/shows/abc', '/studio/go-live'],
      ['/studio/channel', '/studio/go-live'],
      ['/studio/channel?tab=radio', '/studio/go-live'],
    ];
    for (const [location, expected] of covered) {
      expect(litStudioSubmenuDestinations(location), location).toEqual([
        expected,
      ]);
    }
  });

  it('lights the right Broadcast sub-tab for each folded-in Perform page', () => {
    const covered: [string, string][] = [
      ['/studio/go-live', '/studio/go-live'],
      ['/studio/info', '/studio/go-live'],
      ['/studio/schedule', '/studio/schedule'],
      ['/studio/events', '/studio/events'],
      ['/studio/shows', '/studio/shows'],
      ['/studio/channel', '/studio/channel'],
      ['/studio/channel?tab=radio', '/studio/channel?tab=radio'],
      ['/studio/channel?tab=multicast', '/studio/channel?tab=radio'],
    ];
    for (const [location, expectedTo] of covered) {
      const lit = BROADCAST_SUBNAV_ITEMS.filter((item) =>
        isBroadcastSubnavActive(location, item.to),
      ).map((item) => item.to);
      expect(lit, location).toEqual([expectedTo]);
    }
  });

  it('lights nothing in Studio for Library-domain routes (they moved to the main-menu Library item)', () => {
    for (const location of [
      '/library',
      '/library/sounds',
      '/studio/archive/arch-1',
      '/library/collections',
      '/studio/playlists',
      '/studio/stash',
      '/library/smartlinks',
      '/library/media',
    ]) {
      expect(litStudioSubmenuDestinations(location), location).toEqual([]);
    }
  });

  it('does not treat Library routes as a Studio primary section (AppShell renders StudioNav whenever this is truthy)', () => {
    for (const location of [
      '/library',
      '/library/sounds',
      '/library/collections',
      '/library/recordings',
      '/library/smartlinks',
      '/library/upload',
      '/library/media',
    ]) {
      expect(getStudioPrimaryRoute(location), location).toBeNull();
    }
  });

  it('keeps Stripe out of Studio nav unless Stripe is configured', () => {
    const withoutStripe = getStudioSubmenuItems('/studio').map(
      (item) => item.to,
    );
    const withStripe = getStudioSubmenuItems('/studio', {
      stripeConfigured: true,
    }).map((item) => item.to);

    expect(withoutStripe).not.toContain('/studio/stripe');
    expect(SUBMENUS['/studio'].map((item) => item.to)).not.toContain(
      '/studio/stripe',
    );
    expect(withStripe).toEqual(
      expect.arrayContaining(['/studio/revenue', '/studio/stripe']),
    );
    expect(withStripe.indexOf('/studio/stripe')).toBe(
      withStripe.indexOf('/studio/revenue') + 1,
    );
    expect(getStudioPrimaryRoute('/studio/stripe')).toBe('/studio');
  });
});
