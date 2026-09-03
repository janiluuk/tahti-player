import { describe, expect, it } from 'vitest';

import {
  activeListenTab,
  activeMobileItem,
  activeSidebarItem,
  SIDEBAR_UNLIT_INTENTIONAL,
} from './navigationActive';

const SIDEBAR_IDS = [
  'listen',
  'radio',
  'discover',
  'favorites',
  'studio',
  'perform',
  'admin',
  'help',
] as const;

describe('navigation active states', () => {
  const sidebarCases: [string, ReturnType<typeof activeSidebarItem>][] = [
    ['/', 'listen'],
    ['/listen/feed', 'listen'],
    ['/listen/history', 'listen'],
    ['/feed', 'listen'],
    ['/history', 'listen'],
    ['/channel/northern-lights', 'listen'],
    ['/t/arch-1', 'listen'],
    ['/r/demo-release', 'listen'],
    ['/c/northern-lights', 'listen'],
    ['/chat/northern-lights', 'listen'],
    ['/listen/favorites', 'favorites'],
    ['/favorites', 'favorites'],
    ['/library/favorites', 'favorites'],
    ['/radio', 'radio'],
    ['/radio/show/northern-lights', 'radio'],
    ['/discover', 'discover'],
    ['/discover?tab=artists', 'discover'],
    ['/studio', 'studio'],
    ['/studio/branding', 'studio'],
    ['/library', 'studio'],
    ['/library/sounds', 'studio'],
    ['/studio/go-live', 'perform'],
    ['/studio/schedule', 'perform'],
    ['/studio/channel?tab=radio', 'perform'],
    ['/admin', 'admin'],
    ['/admin/users', 'admin'],
    ['/help', 'help'],
    ['/help/getting-started', 'help'],
  ];

  it('lights exactly one desktop sidebar item on covered routes', () => {
    for (const [location, expected] of sidebarCases) {
      expect(activeSidebarItem(location), location).toBe(expected);
    }
  });

  it('never returns two sidebar ids for the same location', () => {
    for (const [location] of sidebarCases) {
      const active = activeSidebarItem(location);
      const matches = SIDEBAR_IDS.filter((id) => id === active);
      expect(matches, location).toHaveLength(1);
    }
  });

  it('does not light Listen and Favorites together', () => {
    expect(activeSidebarItem('/')).toBe('listen');
    expect(activeSidebarItem('/listen/favorites')).toBe('favorites');
    expect(activeSidebarItem('/listen/feed')).toBe('listen');
  });

  it('selects the matching Listen section tab', () => {
    expect(activeListenTab('/')).toBe('listen');
    expect(activeListenTab('/listen/feed')).toBe('feed');
    expect(activeListenTab('/listen/favorites')).toBe('favorites');
    expect(activeListenTab('/listen/history')).toBe('history');
    expect(activeListenTab('/radio')).toBeNull();
  });

  it('keeps phone Listen lit on Favorites because that bar has no Favorites item', () => {
    expect(activeMobileItem('/')).toBe('listen');
    expect(activeMobileItem('/listen/feed')).toBe('listen');
    expect(activeMobileItem('/listen/favorites')).toBe('listen');
    expect(activeMobileItem('/library/favorites')).toBe('library');
    expect(activeMobileItem('/library')).toBe('library');
    expect(activeMobileItem('/studio/go-live')).toBe('studio');
  });

  it('flags intentional unlit sidebar routes instead of guessing a tab', () => {
    for (const path of SIDEBAR_UNLIT_INTENTIONAL) {
      expect(activeSidebarItem(path), path).toBeNull();
    }
  });
});
