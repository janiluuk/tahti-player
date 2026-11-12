import { describe, expect, it } from 'vitest';

import type { ChannelPageItem } from '../../lib/channelPageLayout';
import { channelVisibleItems } from './channelVisibleItems';

const layout: ChannelPageItem[] = [
  { id: 'hero', type: 'hero', visible: true },
  { id: 'about', type: 'about', visible: true },
  { id: 'links', type: 'links', visible: true },
  { id: 'tracks', type: 'sound', visible: true },
];

describe('channelVisibleItems', () => {
  it('keeps links out of the block list', () => {
    const items = channelVisibleItems({
      layout,
      editing: false,
      showNavTabs: false,
      navTabbedItemIds: new Set(),
      activeNavTabItemIds: undefined,
      isRadioChannel: false,
    });
    expect(items.map((item) => item.type)).toEqual(['hero', 'sound']);
  });
});
