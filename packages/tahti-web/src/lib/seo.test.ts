import { describe, expect, it } from 'vitest';

import { metadataForPath, scrollingPlaybackTitle } from './seo';

describe('metadataForPath', () => {
  it.each([
    ['/channel/night-radio', 'Night Radio live on Tahti'],
    ['/c/night-radio', 'Night Radio live on Tahti'],
    ['/u/mart-saar', 'Mart Saar on Tahti'],
    ['/r/summer-release', 'Summer Release on Tahti'],
    ['/radio', 'Tahti Radio'],
    ['/studio/go-live', 'Studio · Tahti'],
  ])('provides route-aware metadata for %s', (path, title) => {
    expect(metadataForPath(path).title).toBe(title);
  });

  it('uses the listen metadata for unknown routes', () => {
    expect(metadataForPath('/unknown')).toEqual({
      title: 'Tahti · Independent music, live',
      description:
        'Listen to independent artists, live channels, radio, and lossless releases on Tahti.',
    });
  });
});

describe('scrollingPlaybackTitle', () => {
  it('rotates the playing track through the browser tab title', () => {
    expect(scrollingPlaybackTitle('Track — Artist · Tahti Radio', 6)).toBe(
      '— Artist · Tahti Radio   Track ',
    );
  });
});
