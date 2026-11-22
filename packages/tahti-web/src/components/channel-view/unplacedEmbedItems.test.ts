import { describe, expect, it } from 'vitest';

import type { ChannelPageItem } from '../../lib/channelPageLayout';
import type { ListenerWidgetInstance } from '../../stores/listenerWidgetsStore';
import { unplacedEmbedItems } from './unplacedEmbedItems';

const instance = (id: string, typeId: string): ListenerWidgetInstance => ({
  id,
  typeId,
  input: 'https://soundcloud.com/artist/track',
  label: `Widget ${id}`,
  addedAt: '2026-11-01T00:00:00.000Z',
});

describe('unplacedEmbedItems', () => {
  it('offers known widgets that are not on the layout yet', () => {
    const layout: ChannelPageItem[] = [
      { id: 'embed-1', type: 'embed', visible: true, embedInstanceId: 'a' },
    ];
    const items = unplacedEmbedItems(
      [
        instance('a', 'soundcloud'),
        instance('b', 'soundcloud'),
        instance('c', 'no-such-type'),
      ],
      layout,
      'External player',
    );
    expect(items).toEqual([
      {
        id: 'b',
        label: 'Widget b',
        hint: 'SoundCloud',
        embedInstanceId: 'b',
      },
    ]);
  });
});
