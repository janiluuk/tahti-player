// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { useListenerWidgetsStore } from './listenerWidgetsStore';

describe('listener widgets store', () => {
  beforeEach(() => {
    localStorage.clear();
    useListenerWidgetsStore.setState({
      installedTypeIds: [],
      instances: [],
      enabledStationIds: [],
      stationOverrides: {},
      savedBrowserStations: [],
    });
  });

  it('uninstalling a type removes its embeds from Listen', () => {
    const store = useListenerWidgetsStore.getState();
    store.installType('youtube');
    store.addInstance(
      'youtube',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'YouTube',
    );
    store.addInstance(
      'spotify',
      'https://open.spotify.com/playlist/37i9dQZF1DX4WYpdgoIcn6',
      'Spotify',
    );

    useListenerWidgetsStore.getState().uninstallType('youtube');

    const next = useListenerWidgetsStore.getState();
    expect(next.installedTypeIds).not.toContain('youtube');
    expect(next.instances.map((instance) => instance.typeId)).toEqual([
      'spotify',
    ]);
  });

  it('favorites install and uninstall do not touch other embeds', () => {
    const store = useListenerWidgetsStore.getState();
    store.installType('favorites');
    store.installType('bandcamp');
    store.addInstance(
      'bandcamp',
      'https://bandcamp.com/EmbeddedPlayer/album=1234567890/size=large/',
      'Bandcamp',
    );

    useListenerWidgetsStore.getState().uninstallType('favorites');

    const next = useListenerWidgetsStore.getState();
    expect(next.installedTypeIds).toEqual(['bandcamp']);
    expect(next.instances).toHaveLength(1);
  });

  it('adds a station saved via URL with extended fields, without duplicating', () => {
    const store = useListenerWidgetsStore.getState();
    store.addSavedBrowserStation({
      id: 'https://stream.example.fi/radio.mp3',
      name: 'Example FM',
      streamUrl: 'https://stream.example.fi/radio.mp3',
      favicon: 'https://example.fi/favicon.ico',
      country: 'Finland',
      homepage: 'https://example.fi',
      countryCode: 'FI',
      description: 'A cozy Finnish station',
      programmingUrl: 'https://example.fi/schedule',
    });

    let stations = useListenerWidgetsStore.getState().savedBrowserStations;
    expect(stations).toHaveLength(1);
    expect(stations[0]).toMatchObject({
      id: 'https://stream.example.fi/radio.mp3',
      name: 'Example FM',
      homepage: 'https://example.fi',
      countryCode: 'FI',
      description: 'A cozy Finnish station',
      programmingUrl: 'https://example.fi/schedule',
    });

    useListenerWidgetsStore.getState().addSavedBrowserStation({
      id: 'https://stream.example.fi/radio.mp3',
      name: 'Example FM',
      streamUrl: 'https://stream.example.fi/radio.mp3',
      description: 'Updated description',
    });

    stations = useListenerWidgetsStore.getState().savedBrowserStations;
    expect(stations).toHaveLength(1);
    expect(stations[0]?.description).toBe('Updated description');
    expect(stations[0]?.homepage).toBe('https://example.fi');
  });

  it('adding a station saved by matching stream URL merges into the existing entry', () => {
    const store = useListenerWidgetsStore.getState();
    store.addSavedBrowserStation({
      id: 'station-uuid-1',
      name: 'Example FM',
      streamUrl: 'https://stream.example.fi/radio.mp3',
    });

    store.addSavedBrowserStation({
      id: 'https://stream.example.fi/radio.mp3',
      name: 'Example FM',
      streamUrl: 'https://stream.example.fi/radio.mp3',
      description: 'Added later',
    });

    const stations = useListenerWidgetsStore.getState().savedBrowserStations;
    expect(stations).toHaveLength(1);
    expect(stations[0]?.description).toBe('Added later');
  });

  it('stores a news feed with thumbnail and page surfaces', () => {
    const store = useListenerWidgetsStore.getState();
    store.installType('news');
    store.addInstance('news', 'https://example.com/rss.xml', 'Desk news', {
      thumbnailUrl: 'https://cdn.example/mark.png',
      surfaces: ['discover'],
    });

    const instance = useListenerWidgetsStore.getState().instances[0];
    expect(instance).toMatchObject({
      typeId: 'news',
      input: 'https://example.com/rss.xml',
      label: 'Desk news',
      thumbnailUrl: 'https://cdn.example/mark.png',
      surfaces: ['discover'],
    });
  });
});
