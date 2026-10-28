import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_WIDGETS, useDiscoverStore } from './discoverStore';

describe('discoverStore', () => {
  afterEach(() => {
    useDiscoverStore.setState({ enabledWidgets: [...DEFAULT_WIDGETS] });
  });

  it('starts with seven widgets, including Tahti Selects, releases and loved', () => {
    expect(DEFAULT_WIDGETS).toHaveLength(7);
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
      'latest-tracks',
      'loved',
      'tahti-selects',
      'latest-releases',
    ]);
    expect(migrated.unheardOnly).toBeUndefined();
  });
});
