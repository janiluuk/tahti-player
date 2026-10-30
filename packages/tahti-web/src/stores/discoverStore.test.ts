import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_WIDGETS, useDiscoverStore } from './discoverStore';

describe('discoverStore', () => {
  afterEach(() => {
    useDiscoverStore.setState({ enabledWidgets: [...DEFAULT_WIDGETS] });
  });

  it('starts with eight widgets, Community stories first', () => {
    expect(DEFAULT_WIDGETS).toHaveLength(8);
    expect(DEFAULT_WIDGETS[0]).toBe('community-stories');
    expect(DEFAULT_WIDGETS).toEqual(
      expect.arrayContaining(['tahti-selects', 'latest-releases', 'loved']),
    );
  });

  it('puts a newly added widget first, once', () => {
    useDiscoverStore.setState({ enabledWidgets: ['latest-tracks'] });
    useDiscoverStore.getState().addWidget('most-played');
    useDiscoverStore.getState().addWidget('most-played');
    expect(useDiscoverStore.getState().enabledWidgets).toEqual([
      'most-played',
      'latest-tracks',
    ]);
  });

  it('gives a stored layout from before the new defaults the three new widgets once', async () => {
    const options = useDiscoverStore.persist.getOptions();
    const migrated = (await options.migrate!(
      {
        enabledWidgets: ['latest-tracks', 'loved'],
        unheardOnly: true,
      },
      0,
    )) as Record<string, unknown>;
    expect(migrated.enabledWidgets).toEqual([
      'community-stories',
      'latest-tracks',
      'loved',
      'tahti-selects',
      'latest-releases',
    ]);
    expect(migrated.unheardOnly).toBeUndefined();
  });

  it('adds Community stories first to a version 1 layout, once', async () => {
    const options = useDiscoverStore.persist.getOptions();
    const fresh = (await options.migrate!(
      { enabledWidgets: ['latest-tracks'] },
      1,
    )) as { enabledWidgets: string[] };
    expect(fresh.enabledWidgets).toEqual([
      'community-stories',
      'latest-tracks',
    ]);
    const removed = (await options.migrate!(
      { enabledWidgets: ['latest-tracks'] },
      2,
    )) as { enabledWidgets: string[] };
    expect(removed.enabledWidgets).toEqual(['latest-tracks']);
  });
});
