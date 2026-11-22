import { afterEach, describe, expect, it } from 'vitest';

import { DEFAULT_WIDGETS, useDiscoverStore } from './discoverStore';

describe('discoverStore', () => {
  afterEach(() => {
    useDiscoverStore.setState({ enabledWidgets: [...DEFAULT_WIDGETS] });
  });

  it('starts with eight widgets; Community stories live in the Feed tab', () => {
    expect(DEFAULT_WIDGETS).toHaveLength(8);
    expect(DEFAULT_WIDGETS).not.toContain('community-stories');
    expect(DEFAULT_WIDGETS).toEqual(
      expect.arrayContaining([
        'tahti-selects',
        'latest-releases',
        'loved',
        'upcoming-events',
      ]),
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
      'upcoming-events',
    ]);
    expect(migrated.unheardOnly).toBeUndefined();
  });

  it('adds the Upcoming events widget to a stored layout once', async () => {
    const options = useDiscoverStore.persist.getOptions();
    const migrated = (await options.migrate!(
      { enabledWidgets: ['latest-tracks'] },
      3,
    )) as { enabledWidgets: string[] };
    expect(migrated.enabledWidgets).toEqual([
      'latest-tracks',
      'upcoming-events',
    ]);
    const again = (await options.migrate!(
      { enabledWidgets: ['upcoming-events', 'latest-tracks'] },
      3,
    )) as { enabledWidgets: string[] };
    expect(again.enabledWidgets).toEqual(['upcoming-events', 'latest-tracks']);
  });

  it('drops Community stories from a stored layout (now in the Feed tab)', async () => {
    const options = useDiscoverStore.persist.getOptions();
    const migrated = (await options.migrate!(
      { enabledWidgets: ['community-stories', 'latest-tracks'] },
      2,
    )) as { enabledWidgets: string[] };
    expect(migrated.enabledWidgets).toEqual([
      'latest-tracks',
      'upcoming-events',
    ]);
  });
});
