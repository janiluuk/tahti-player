// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import { applyLocale } from './locale';
import {
  metadataForPath,
  playbackDocumentTitle,
  setPlaybackDocumentTitle,
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
    ['/studio/go-live', 'Broadcast · Studio · Tahti'],
    ['/studio/releases/abc/edit', 'Releases · Studio · Tahti'],
    ['/admin/content-reports', 'Content reports · Admin · Tahti'],
    ['/library', 'Library · Tahti'],
    ['/library/sounds', 'Sounds · Tahti'],
    ['/library/collections', 'Collections · Library · Tahti'],
    ['/discover', 'Discover · Tahti'],
    ['/governance/members', 'Member directory · Tahti'],
    ['/governance/motions/m1', 'Governance · Tahti'],
    ['/listen/history', 'History · Tahti'],
    ['/settings', 'Settings · Tahti'],
    ['/about', 'About · Tahti'],
    ['/what-is-it', 'What is it · Tahti'],
    ['/how-it-works', 'How it works · Tahti'],
    ['/for-artists', 'For artists · Tahti'],
    ['/terms', 'Terms of service · Tahti'],
    ['/privacy', 'Privacy policy · Tahti'],
    ['/agpl', 'Source code & AGPL licence · Tahti'],
    ['/subscribe/liis-kask', 'Subscribe to Liis Kask · Tahti'],
    ['/subscribe', 'Subscribe · Tahti'],
    ['/newsletter/confirmed', 'Newsletter · Tahti'],
    ['/moderate/night-drive', 'Night Drive: chat moderation · Tahti'],
    ['/moderate', 'Chat moderation · Tahti'],
    ['/jam/abc123', 'Jam · Tahti'],
  ])('provides route-aware metadata for %s', (path, title) => {
    expect(metadataForPath(path).title).toBe(title);
  });

  it('titles pages and Studio sections in Finnish when the language is Finnish', async () => {
    await applyLocale('fi_FI');
    try {
      expect(metadataForPath('/discover').title).toBe('Löydä · Tahti');
      expect(metadataForPath('/terms').title).toBe('Käyttöehdot · Tahti');
      expect(metadataForPath('/studio/go-live').title).toBe(
        'Lähetys · Studio · Tahti',
      );
      expect(metadataForPath('/studio/releases/abc/edit').title).toBe(
        'Julkaisut · Studio · Tahti',
      );
      expect(metadataForPath('/admin').title).toBe('Ylläpito · Tahti');
      expect(metadataForPath('/admin/top-lists').title).toBe(
        'Huippulistat · Ylläpito · Tahti',
      );
      expect(metadataForPath('/library/collections').title).toBe(
        'Kokoelmat · Kirjasto · Tahti',
      );
    } finally {
      await applyLocale('en_US');
    }
  });

  it('names the notifications page', () => {
    expect(metadataForPath('/notifications').title).toContain('Notifications');
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

describe('playbackDocumentTitle', () => {
  it('names what is on and who plays it', () => {
    expect(playbackDocumentTitle('Aamulähetys · Juontaja', 'YleX')).toBe(
      '▶ Aamulähetys · Juontaja — YleX · Tahti',
    );
  });

  it('says a station name once when nothing more is known', () => {
    expect(playbackDocumentTitle('YleX', 'YleX')).toBe('▶ YleX · Tahti');
  });
});

describe('syncDocumentMetadata / setPlaybackDocumentTitle', () => {
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

  it('keeps the playback title while a page syncs its own metadata', () => {
    setPlaybackDocumentTitle('▶ Aamu — YleX · Tahti');
    syncDocumentMetadata('/channel/night-radio', {
      title: 'Real Channel Name live on Tahti',
      image: 'https://cdn.tahti.live/avatar.jpg',
    });
    expect(document.title).toBe('▶ Aamu — YleX · Tahti');
    expect(ogImage()).toBe('https://cdn.tahti.live/avatar.jpg');
    setPlaybackDocumentTitle(null);
    expect(document.title).toBe('Real Channel Name live on Tahti');
  });
});

describe('metadataForPath radio description in Finnish', () => {
  it('translates the Radio description', async () => {
    await applyLocale('fi_FI');
    try {
      expect(metadataForPath('/radio').description).toBe(
        'Kuuntele osuuskunnan Tahti Radio -lähetystä ja katso ohjelma-aikataulu.',
      );
    } finally {
      await applyLocale('en_US');
    }
  });
});
