import { describe, expect, it } from 'vitest';

import {
  getStudioPrimaryRoute,
  getStudioSubmenuItems,
  litStudioSubmenuDestinations,
  SUBMENUS,
} from './StudioNav';

describe('StudioNav section coverage', () => {
  // A submenu link whose own path doesn't resolve back to the primary
  // section it lives under falls back to StudioNavigation's '/studio'
  // default: landing on that page highlights no top-level tab (Studio /
  // Perform) and no submenu item, even though the page renders a
  // real subtabs bar. This caught /studio/branding shipping unregistered.
  for (const [section, items] of Object.entries(SUBMENUS)) {
    for (const item of items) {
      it(`"${item.to}" (under ${section}) resolves back to ${section}`, () => {
        expect(getStudioPrimaryRoute(item.to)).toBe(section);
      });
    }
  }

  it('keeps multicast under Radio instead of a Perform sibling', () => {
    const destinations = SUBMENUS['/studio/go-live'].map((item) => item.to);
    expect(destinations).not.toContain('/studio/channel?tab=multicast');
    expect(destinations).toContain('/studio/channel?tab=radio');
  });

  it('folds Library into Studio and keeps /library routes on Studio', () => {
    expect(SUBMENUS).not.toHaveProperty('/library');
    const destinations = SUBMENUS['/studio'].map((item) => item.to);
    expect(destinations).toEqual(
      expect.arrayContaining([
        '/library',
        '/library/sounds',
        '/library/collections',
        '/studio/releases',
        '/library/upload',
        '/studio/editor',
      ]),
    );
    expect(getStudioPrimaryRoute('/library')).toBe('/studio');
    expect(getStudioPrimaryRoute('/library/sounds')).toBe('/studio');
    expect(getStudioPrimaryRoute('/library/collections')).toBe('/studio');
    expect(getStudioPrimaryRoute('/library/upload')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/releases')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/go-live')).toBe('/studio/go-live');
  });

  it('lights exactly one Studio submenu item on covered catalog routes', () => {
    const covered: [string, string][] = [
      ['/studio', '/studio'],
      ['/studio/branding', '/studio/branding'],
      ['/studio/setup-channel', '/studio/branding'],
      ['/studio/stats', '/studio/stats'],
      ['/studio/insights', '/studio/stats'],
      ['/library', '/library'],
      ['/library/sounds', '/library/sounds'],
      ['/studio/archive/arch-1', '/library/sounds'],
      ['/library/collections', '/library/collections'],
      ['/studio/playlists', '/library/collections'],
      ['/studio/stash', '/library/collections'],
      ['/library/smartlinks', '/library/collections'],
      ['/library/media', '/library/collections'],
      ['/studio/editor', '/studio/editor'],
      ['/studio/mastering/arch-1', '/studio/editor'],
      ['/studio/releases', '/studio/releases'],
      ['/studio/distribution', '/studio/releases'],
      ['/studio/go-live', '/studio/go-live'],
      ['/studio/info', '/studio/go-live'],
      ['/studio/channel', '/studio/channel'],
      ['/studio/channel?tab=radio', '/studio/channel?tab=radio'],
    ];
    for (const [location, expected] of covered) {
      expect(litStudioSubmenuDestinations(location), location).toEqual([
        expected,
      ]);
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
