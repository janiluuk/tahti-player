import { describe, expect, it } from 'vitest';

import { ARTIST_TAB_GROUPS } from './artistTabGroups';
import { groupTabs, tabLanding } from './tabGroups';

const tabs = (...ids: string[]) => ids.map((id) => ({ id }));

const ALL_ARTIST_TABS = tabs(
  'identity',
  'story',
  'people',
  'connections',
  'branding',
  'gallery',
  'press-kit',
  'release-visuals',
);

describe('artist tab groups', () => {
  it('puts every tab in exactly one of three groups', () => {
    const grouped = groupTabs(ARTIST_TAB_GROUPS, ALL_ARTIST_TABS);
    expect(grouped.map((entry) => entry.group.label)).toEqual([
      'Profile',
      'Links & press',
      'Visuals',
    ]);
    const placed = grouped.flatMap((entry) => entry.tabs.map((tab) => tab.id));
    expect([...placed].sort()).toEqual(
      ALL_ARTIST_TABS.map((tab) => tab.id).sort(),
    );
  });

  it('lands a deep link on its group and tab', () => {
    const grouped = groupTabs(ARTIST_TAB_GROUPS, ALL_ARTIST_TABS);
    expect(tabLanding(grouped, 'press-kit')).toEqual({ group: 1, tab: 1 });
    expect(tabLanding(grouped, 'gallery')).toEqual({ group: 2, tab: 1 });
  });

  it('counts only the tabs that are shown', () => {
    const solo = ALL_ARTIST_TABS.filter((tab) => tab.id !== 'people');
    const grouped = groupTabs(ARTIST_TAB_GROUPS, solo);
    expect(grouped[0].tabs.map((tab) => tab.id)).toEqual(['identity', 'story']);
    expect(tabLanding(grouped, 'people')).toEqual({ group: 0, tab: 0 });
  });

  it('opens on the first tab without a deep link', () => {
    const grouped = groupTabs(ARTIST_TAB_GROUPS, ALL_ARTIST_TABS);
    expect(tabLanding(grouped, null)).toEqual({ group: 0, tab: 0 });
  });
});
