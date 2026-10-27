import { describe, expect, it } from 'vitest';

import { playsCsv } from './helpers';

describe('playsCsv', () => {
  it('writes one row per day with the downloads / smart-link split', () => {
    expect(
      playsCsv([
        { date: '2026-10-01', plays: 5, downloads: 3, smartLinkClicks: 2 },
        { date: '2026-10-02', plays: 1 },
      ]),
    ).toBe(
      'date,plays,downloads,smart_link_clicks\r\n2026-10-01,5,3,2\r\n2026-10-02,1,,',
    );
  });
});
