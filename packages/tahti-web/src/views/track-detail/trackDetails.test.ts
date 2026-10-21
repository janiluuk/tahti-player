import { describe, expect, it } from 'vitest';

import {
  hasTrackDetailFacts,
  mixVersionLabel,
  trackDetailFacts,
} from './trackDetails';

describe('trackDetailFacts', () => {
  it('collects genre, sub-genres, tempo, key, licence, credits and commentary', () => {
    const facts = trackDetailFacts({
      genre: 'Techno',
      subGenres: ['Dub techno', 'techno', ' '],
      tags: ['Late night', 'late night', ' Kaiku '],
      effectiveBpm: 127.6,
      effectiveKey: 'Am',
      license: 'CC_BY_NC',
      credits: [
        { role: 'producer', name: 'Aino', artistUsername: 'aino' },
        { role: 'engineer', name: 'Mikko' },
      ],
      commentary: '  Recorded live at Kaiku.  ',
    });
    expect(facts).toEqual({
      genres: ['Techno', 'Dub techno'],
      tags: ['Late night', 'Kaiku'],
      bpm: 128,
      musicalKey: 'Am',
      license: 'CC BY-NC',
      credits: [
        { role: 'Producer', name: 'Aino', artistUsername: 'aino' },
        { role: 'Engineer', name: 'Mikko', artistUsername: null },
      ],
      commentary: 'Recorded live at Kaiku.',
      venue: null,
    });
    expect(hasTrackDetailFacts(facts)).toBe(true);
  });

  it('keeps a recorded-at venue only when it has a name and slug', () => {
    expect(
      trackDetailFacts({ venue: { name: ' Kaiku ', slug: 'kaiku' } }).venue,
    ).toEqual({ name: 'Kaiku', slug: 'kaiku' });
    expect(trackDetailFacts({ venue: null }).venue).toBeNull();
    expect(trackDetailFacts({}).venue).toBeNull();
    expect(
      hasTrackDetailFacts(
        trackDetailFacts({ venue: { name: 'Kaiku', slug: 'kaiku' } }),
      ),
    ).toBe(true);
  });

  it('treats missing tags from an older API as none', () => {
    const facts = trackDetailFacts({ genre: 'House' });
    expect(facts.tags).toEqual([]);
    expect(hasTrackDetailFacts(trackDetailFacts({ tags: ['drone'] }))).toBe(
      true,
    );
  });

  it('never uses an email address as a credit name', () => {
    const facts = trackDetailFacts({
      credits: [
        { role: 'writer', name: 'aino@example.com', artistUsername: 'aino' },
        { role: 'producer', name: 'Mail me: mikko@example.fi' },
      ],
    });
    expect(facts.credits).toEqual([
      { role: 'Writer', name: 'aino', artistUsername: 'aino' },
    ]);
  });

  it('drops malformed credit rows and invalid usernames', () => {
    const facts = trackDetailFacts({
      credits: [
        null,
        'Aino',
        { role: '', name: 'Aino' },
        { role: 'remixer', name: 'Mikko', artistUsername: 'not a username!' },
      ],
    });
    expect(facts.credits).toEqual([
      { role: 'Remixer', name: 'Mikko', artistUsername: null },
    ]);
  });

  it('treats the default licence and empty fields as nothing to show', () => {
    const facts = trackDetailFacts({
      genre: null,
      subGenres: [],
      effectiveBpm: null,
      effectiveKey: null,
      license: 'ALL_RIGHTS_RESERVED',
      credits: null,
      commentary: '   ',
    });
    expect(hasTrackDetailFacts(facts)).toBe(false);
  });

  it('tolerates a response from an API that omits these fields', () => {
    expect(hasTrackDetailFacts(trackDetailFacts({}))).toBe(false);
  });
});

describe('mixVersionLabel', () => {
  it('strips the parentheses an artist typed', () => {
    expect(mixVersionLabel('Aamu', '(Extended Mix)')).toBe('Extended Mix');
    expect(mixVersionLabel('Aamu', 'Dub')).toBe('Dub');
  });

  it('hides an empty mix version or one already in the title', () => {
    expect(mixVersionLabel('Aamu', null)).toBeNull();
    expect(mixVersionLabel('Aamu', '  ')).toBeNull();
    expect(mixVersionLabel('Aamu (Extended Mix)', 'extended mix')).toBeNull();
  });
});
