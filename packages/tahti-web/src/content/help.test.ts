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

  it('has a Choose a look section', () => {
    const article = getHelpArticle('channel-design');
    const look = article?.sections.find(
      (section) => section.heading === 'Choose a look',
    );

    expect(look).toBeDefined();
  });
});

describe('shared jam help', () => {
  it('documents Start a Jam and distinguishes the desktop remote', () => {
    const article = getHelpArticle('shared-jam');
    expect(article?.title).toBe('Shared listening (Jam)');
    const start = article?.sections.find(
      (section) => section.heading === 'Start a Jam',
    );
    expect(start?.body.some((line) => line.includes('Start a Jam'))).toBe(true);
    const remote = article?.sections.find(
      (section) => section.heading === 'Not the desktop remote',
    );
    expect(
      remote?.body.some((line) => line.includes('Settings → Integrations')),
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
    expect(
      flow?.body.some((line) => line.includes('not a guaranteed bank deposit')),
    ).toBe(true);
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

describe('governance help', () => {
  it('explains discussions and that they are not votes', () => {
    const discussions = getHelpArticle('governance')?.sections.find(
      (section) => section.heading === 'Discussions',
    );
    expect(
      discussions?.body.some((line) =>
        line.includes('/governance/discussions'),
      ),
    ).toBe(true);
    expect(discussions?.body.some((line) => line.includes('not a vote'))).toBe(
      true,
    );
  });
});

describe('member governance and venue help', () => {
  it('names the member governance panels', () => {
    const member = getHelpArticle('tier-limits')?.sections.find(
      (section) => section.heading === 'Tahti ry member',
    );
    expect(member?.body.some((line) => line.includes('board elections'))).toBe(
      true,
    );
    expect(
      member?.body.some((line) => line.includes('Request a correction')),
    ).toBe(true);
  });

  it('points venue owners at My venues', () => {
    const find = getHelpArticle('for-listeners')?.sections.find(
      (section) => section.heading === 'Find something to listen to',
    );
    expect(find?.body.some((line) => line.includes('/venues/mine'))).toBe(true);
  });
});

describe('admin governance help', () => {
  it('names the Board and Records tabs', () => {
    const areas = getHelpArticle('admin-guide')?.sections.find(
      (section) => section.heading === 'Admin areas',
    );
    expect(
      areas?.body.some((line) => line.includes('Governance → Board')),
    ).toBe(true);
    expect(
      areas?.body.some((line) => line.includes('Governance → Records')),
    ).toBe(true);
  });
});

describe('admin meeting records help', () => {
  it('names agenda items and motion actions', () => {
    const areas = getHelpArticle('admin-guide')?.sections.find(
      (section) => section.heading === 'Admin areas',
    );
    expect(
      areas?.body.some((line) => line.includes('agenda as numbered items')),
    ).toBe(true);
    expect(
      areas?.body.some((line) =>
        line.includes('circulate a draft for seconds'),
      ),
    ).toBe(true);
  });
});

describe('account security help', () => {
  it('lists the account emails and where to change credentials', () => {
    const article = getHelpArticle('account-security');
    const text = article?.sections.flatMap((section) => section.body).join(' ');
    expect(text).toContain('Settings → Account → Password & email');
    expect(text).toContain('a new API token is created');
    expect(text).toContain('at least 10 characters');
  });
});

describe('studio notices help', () => {
  it('lists the background work notices and the switch', () => {
    const article = getHelpArticle('studio-notices');
    const text = article?.sections.flatMap((section) => section.body).join(' ');
    expect(text).toContain('Settings → Notifications → Studio work');
    expect(text).toContain('could not be processed');
  });
});
