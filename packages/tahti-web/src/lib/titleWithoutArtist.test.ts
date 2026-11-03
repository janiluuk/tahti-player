import { describe, expect, it } from 'vitest';

import { titleWithoutArtist } from './titleWithoutArtist';

describe('titleWithoutArtist', () => {
  it('drops a leading artist and dash', () => {
    expect(
      titleWithoutArtist('Minh Nguyen — Acoustic Set', 'Minh Nguyen'),
    ).toBe('Acoustic Set');
    expect(titleWithoutArtist('Yaniho - Flux (liminal mix)', 'yaniho')).toBe(
      'Flux (liminal mix)',
    );
  });

  it('keeps titles that only start with the same word', () => {
    expect(titleWithoutArtist('Yanihorizon', 'Yaniho')).toBe('Yanihorizon');
    expect(titleWithoutArtist('Night Drive', '')).toBe('Night Drive');
  });

  it('keeps the title when nothing follows the artist', () => {
    expect(titleWithoutArtist('Yaniho —', 'Yaniho')).toBe('Yaniho —');
  });
});
