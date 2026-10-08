// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  metadataForPath,
  reapplyLastMetadata,
  scrollingPlaybackTitle,
  syncDocumentMetadata,
} from './seo';

describe('metadataForPath', () => {
  it.each([
    ['/channel/night-radio', 'Night Radio live on Tahti'],
    ['/c/night-radio', 'Night Radio live on Tahti'],
    ['/u/mart-saar', 'Mart Saar on Tahti'],
    ['/u/mart-saar/c/late-nights', 'Late Nights by Mart Saar on Tahti'],
    ['/v/tavastia', 'Tavastia on Tahti'],
    ['/r/summer-release', 'Summer Release on Tahti'],
    ['/radio', 'Tahti Radio'],
    ['/studio', 'Studio · Tahti'],
    ['/studio/go-live', 'Go live · Studio · Tahti'],
    ['/studio/releases/abc/edit', 'Releases · Studio · Tahti'],
    ['/admin/content-reports', 'Content reports · Admin · Tahti'],
    ['/library', 'Library · Tahti'],
    ['/library/sounds', 'Tracks · Tahti'],
    ['/library/collections', 'Collections · Library · Tahti'],
    ['/discover', 'Discover · Tahti'],
    ['/governance/members', 'Member directory · Tahti'],
    ['/governance/motions/m1', 'Governance · Tahti'],
    ['/listen/history', 'History · Tahti'],
    ['/settings', 'Settings · Tahti'],
  ])('provides route-aware metadata for %s', (path, title) => {
    expect(metadataForPath(path).title).toBe(title);
  });

  it('does not mistake a longer first segment for a known page', () => {
    expect(metadataForPath('/helpers').title).toBe(
      'Tahti · Independent music, live',
    );
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

describe('syncDocumentMetadata / reapplyLastMetadata', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <meta name="description" content="" />
      <meta property="og:title" content="" />
      <meta property="og:description" content="" />
      <meta property="og:url" content="" />
      <meta property="og:image" content="https://tahti.live/og-image.png" />
      <link rel="canonical" href="" />
    `;
  });

  function ogImage(): string | null {
    return (
      document.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute('content') ?? null
    );
  }

  it('applies the slug-guessed metadata with no overrides', () => {
    syncDocumentMetadata('/channel/night-radio');
    expect(document.title).toBe('Night Radio live on Tahti');
    expect(ogImage()).toBe('https://tahti.live/og-image.png');
  });

  it('overrides the slug guess with real data once it is available', () => {
    syncDocumentMetadata('/channel/night-radio', {
      title: 'Real Channel Name live on Tahti',
      description: 'A real bio.',
      image: 'https://cdn.tahti.live/avatar.jpg',
    });
    expect(document.title).toBe('Real Channel Name live on Tahti');
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe('A real bio.');
    expect(ogImage()).toBe('https://cdn.tahti.live/avatar.jpg');
  });

  it('re-applies the last-synced metadata for the same path instead of re-guessing', () => {
    syncDocumentMetadata('/channel/night-radio', {
      title: 'Real Channel Name live on Tahti',
      image: 'https://cdn.tahti.live/avatar.jpg',
    });
    document.title = 'Something else entirely';
    reapplyLastMetadata('/channel/night-radio');
    expect(document.title).toBe('Real Channel Name live on Tahti');
    expect(ogImage()).toBe('https://cdn.tahti.live/avatar.jpg');
  });

  it('falls back to a fresh guess when re-applying for a different path', () => {
    syncDocumentMetadata('/channel/night-radio', {
      title: 'Real Channel Name live on Tahti',
    });
    reapplyLastMetadata('/u/mart-saar');
    expect(document.title).toBe('Mart Saar on Tahti');
  });
});
