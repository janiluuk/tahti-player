import { describe, expect, it } from 'vitest';

import { getHelpArticle } from './help';

describe('artist gallery help', () => {
  it('moves gallery how-to into the artist guide', () => {
    const article = getHelpArticle('for-artists');
    const gallery = article?.sections.find(
      (section) => section.heading === 'Artist gallery',
    );

    expect(gallery).toBeDefined();
    expect(
      gallery?.body.some((line) =>
        line.includes('Settings → Artist → Gallery'),
      ),
    ).toBe(true);
    expect(
      gallery?.body.some((line) => line.includes('Drag a photo to reorder')),
    ).toBe(true);
    expect(
      gallery?.body.some((line) =>
        line.includes('no separate Add images button'),
      ),
    ).toBe(true);
  });

  it('points channel design help at Settings Artist Channel Designer', () => {
    const article = getHelpArticle('channel-design');
    const look = article?.sections.find(
      (section) => section.heading === 'Choose a look',
    );

    expect(look).toBeDefined();
    expect(
      look?.body.some((line) =>
        line.includes('Settings → Artist → Channel Designer'),
      ),
    ).toBe(true);
  });
});

describe('earnings help', () => {
  it('explains the fan-sub order split and points at Studio Audience', () => {
    const article = getHelpArticle('earnings');
    expect(article?.title).toBe('Earnings and fan-sub orders');
    const flow = article?.sections.find(
      (section) => section.heading === 'The money flow',
    );
    expect(flow?.body.some((line) => line.includes('€4.45'))).toBe(true);
    expect(flow?.body.some((line) => line.includes('payout runbook'))).toBe(
      true,
    );
    const where = article?.sections.find(
      (section) => section.heading === 'Where to look',
    );
    expect(where?.body.some((line) => line.includes('Studio → Audience'))).toBe(
      true,
    );
    expect(where?.body.some((line) => line.includes('Stripe dashboard'))).toBe(
      true,
    );
  });
});
