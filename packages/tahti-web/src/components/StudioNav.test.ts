import { describe, expect, it } from 'vitest';

import { i18n } from '@tahti-player/i18n';

import {
  GO_LIVE_TABS,
  goLiveTabPath,
  isGoLiveSessionRoute,
  isGoLiveSessionTabActive,
} from '../views/studio/go-live/goLiveTabs';
import {
  BROADCAST_SUBNAV_ITEMS,
  CATALOG_SUBNAV_ITEMS,
  getStudioPrimaryRoute,
  getStudioSubmenuItems,
  hasStudioNestedNav,
  isBroadcastSubnavActive,
  isCatalogSubnavActive,
  isStudioBroadcastGroup,
  isStudioFansGroup,
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
      expect.arrayContaining(['/studio/releases', '/studio/broadcast']),
    );
    expect(destinations).not.toEqual(
      expect.arrayContaining(['/studio/distribution', '/studio/editor']),
    );
    expect(getStudioPrimaryRoute('/studio/releases')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/distribution')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/editor')).toBe('/studio');
    expect(getStudioPrimaryRoute('/studio/go-live')).toBe('/studio');
  });

  it('lights exactly one Studio submenu item on covered catalog routes, folding Perform/go-live pages into the single Broadcast tab', () => {
    const covered: [string, string][] = [
      ['/studio', '/studio'],
      ['/studio/stats', '/studio/stats'],
      ['/studio/insights', '/studio/stats'],
      ['/studio/editor', '/studio/releases'],
      ['/studio/mastering/arch-1', '/studio/releases'],
      ['/studio/releases', '/studio/releases'],
      ['/studio/distribution', '/studio/releases'],
      ['/studio/broadcast', '/studio/broadcast'],
      ['/studio/go-live', '/studio/broadcast'],
      ['/studio/info', '/studio/broadcast'],
      ['/studio/schedule', '/studio/broadcast'],
      ['/studio/events', '/studio/broadcast'],
      ['/studio/events/new', '/studio/broadcast'],
      ['/studio/shows', '/studio/broadcast'],
      ['/studio/shows/abc', '/studio/broadcast'],
      ['/studio/channel', '/studio/broadcast'],
      ['/studio/channel?tab=radio', '/studio/broadcast'],
      ['/studio/fans', '/studio/fans'],
      ['/studio/updates', '/studio/fans'],
      ['/studio/updates?tab=newsletter', '/studio/fans'],
      ['/studio/audience', '/studio/fans'],
      ['/studio/audience?tab=tiers', '/studio/fans'],
      ['/studio/audience?tab=store', '/studio/fans'],
      ['/studio/stripe', '/studio/fans'],
      ['/studio/revenue', '/studio/fans'],
      ['/studio/profile', '/studio/profile'],
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
      ['/studio/channel?tab=rotation', '/studio/channel?tab=radio'],
      ['/studio/channel?tab=pinned', '/studio/channel?tab=radio'],
      ['/studio/channel?tab=tahti-radio', '/studio/channel?tab=radio'],
      ['/studio/channel?tab=announcements', '/studio/channel?tab=radio'],
    ];
    for (const [location, expectedTo] of covered) {
      const lit = BROADCAST_SUBNAV_ITEMS.filter((item) =>
        isBroadcastSubnavActive(location, item.to),
      ).map((item) => item.to);
      expect(lit, location).toEqual([expectedTo]);
    }
  });

  it('lights Go live, and only Go live, on the green-room tab of /studio/go-live', () => {
    for (const location of [
      '/studio/go-live?tab=green-room',
      '/studio/go-live?tab=prep',
    ]) {
      const lit = BROADCAST_SUBNAV_ITEMS.filter((item) =>
        isBroadcastSubnavActive(location, item.to),
      ).map((item) => item.to);
      expect(lit, location).toEqual(['/studio/go-live']);
      expect(litStudioSubmenuDestinations(location), location).toEqual([
        '/studio/broadcast',
      ]);
      expect(isStudioBroadcastGroup(location), location).toBe(true);
      expect(isGoLiveSessionRoute(location), location).toBe(true);
    }
  });

  it('on go-live session chrome, lights exactly one Prep tab from the URL', () => {
    expect(isGoLiveSessionTabActive('/studio/go-live', 'prep')).toBe(true);
    expect(
      isGoLiveSessionTabActive(
        '/studio/go-live?tab=credentials',
        'credentials',
      ),
    ).toBe(true);
    expect(
      isGoLiveSessionTabActive('/studio/go-live?tab=green-room', 'green-room'),
    ).toBe(true);
    expect(
      isGoLiveSessionTabActive('/studio/go-live?tab=credentials', 'prep'),
    ).toBe(false);
    expect(isGoLiveSessionRoute('/studio/schedule')).toBe(false);
    expect(GO_LIVE_TABS.map(goLiveTabPath)).toEqual([
      '/studio/go-live',
      '/studio/go-live?tab=credentials',
      '/studio/go-live?tab=recording',
      '/studio/go-live?tab=destinations',
      '/studio/go-live?tab=green-room',
    ]);
  });

  it('keeps Go live unlit on the Channel green-room tab', () => {
    const location = '/studio/channel?tab=green-room';
    const lit = BROADCAST_SUBNAV_ITEMS.filter((item) =>
      isBroadcastSubnavActive(location, item.to),
    ).map((item) => item.to);
    expect(lit).toEqual(['/studio/channel']);
  });

  it('lights the right Music sub-tab for releases, distribution, and editor', () => {
    const covered: [string, string][] = [
      ['/studio/releases', '/studio/releases'],
      ['/studio/releases/rel-1', '/studio/releases'],
      ['/studio/distribution', '/studio/distribution'],
      ['/studio/editor', '/studio/editor'],
      ['/studio/editor/proj-1', '/studio/editor'],
      ['/studio/mastering/arch-1', '/studio/editor'],
    ];
    for (const [location, expectedTo] of covered) {
      const lit = CATALOG_SUBNAV_ITEMS.filter((item) =>
        isCatalogSubnavActive(location, item.to),
      ).map((item) => item.to);
      expect(lit, location).toEqual([expectedTo]);
    }
  });

  it('classifies Broadcast and Fans route groups for nested chrome', () => {
    expect(isStudioBroadcastGroup('/studio/go-live')).toBe(true);
    expect(isStudioBroadcastGroup('/studio/shows/abc')).toBe(true);
    expect(isStudioBroadcastGroup('/studio')).toBe(false);
    expect(isStudioFansGroup('/studio/audience?tab=tiers')).toBe(true);
    expect(isStudioFansGroup('/studio/stripe')).toBe(true);
    expect(isStudioFansGroup('/studio/updates')).toBe(true);
    expect(isStudioFansGroup('/studio/branding')).toBe(false);
  });

  it('shows the Fans back link on Fans pages but not on the hub itself', () => {
    expect(hasStudioNestedNav('/studio/fans')).toBe(false);
    expect(hasStudioNestedNav('/studio/updates')).toBe(true);
    expect(hasStudioNestedNav('/studio/audience?tab=store')).toBe(true);
  });

  it('has six one-word tabs in plan order: Home, Music, Broadcast, Fans, Stats, Profile', () => {
    const labels = SUBMENUS['/studio'].map((item) =>
      i18n.t(`web:${item.labelKey}`),
    );
    expect(labels).toEqual([
      'Home',
      'Music',
      'Broadcast',
      'Fans',
      'Stats',
      'Profile',
    ]);
    const items = getStudioSubmenuItems('/studio').map((item) => item.to);
    expect(items).not.toContain('/studio/stripe');
    expect(items).not.toContain('/studio/audience');
    expect(items).not.toContain('/studio/updates');
    expect(getStudioPrimaryRoute('/studio/stripe')).toBe('/studio');
  });

  it('lights nothing in Studio for Library-domain routes (they moved to the main-menu Library item)', () => {
    for (const location of [
      '/library',
      '/library/sounds',
      '/studio/sounds',
      '/studio/sounds/arch-1',
      '/studio/archive/arch-1',
      '/library/collections',
      '/studio/collections',
      '/studio/playlists',
      '/studio/stash',
      '/library/smartlinks',
      '/library/media',
      '/library/upload',
    ]) {
      expect(litStudioSubmenuDestinations(location), location).toEqual([]);
      expect(getStudioPrimaryRoute(location), location).toBeNull();
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
      '/studio/sounds',
      '/studio/collections',
    ]) {
      expect(getStudioPrimaryRoute(location), location).toBeNull();
    }
  });
});

describe('StudioNav Broadcast labels', () => {
  const studioLabel = (to: string) => {
    const item = SUBMENUS['/studio'].find((entry) => entry.to === to);
    return item ? i18n.t(`web:${item.labelKey}`) : undefined;
  };
  const subnavLabel = (to: string) => {
    const item = BROADCAST_SUBNAV_ITEMS.find((entry) => entry.to === to);
    return item ? i18n.t(`web:${item.labelKey}`) : undefined;
  };

  it('calls the Studio submenu entry for /studio/broadcast "Broadcast"', () => {
    expect(studioLabel('/studio/broadcast')).toBe('Broadcast');
  });

  it('calls the first Broadcast subnav entry for /studio/go-live "Go live"', () => {
    expect(BROADCAST_SUBNAV_ITEMS[0]?.to).toBe('/studio/go-live');
    expect(subnavLabel('/studio/go-live')).toBe('Go live');
  });

  it('keeps the two labels distinct so the nested strip does not repeat its parent tab', () => {
    expect(studioLabel('/studio/broadcast')).not.toBe(
      subnavLabel('/studio/go-live'),
    );
  });

  it('never shows "Go live" as a Studio submenu label', () => {
    const labels = SUBMENUS['/studio'].map((item) =>
      i18n.t(`web:${item.labelKey}`),
    );
    expect(labels).toContain('Broadcast');
    expect(labels).not.toContain('Go live');
  });
});
