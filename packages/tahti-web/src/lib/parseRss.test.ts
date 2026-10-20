// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { isHttpUrl, parseRssXml } from './parseRss';

const RSS = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Tahti News</title>
    <item>
      <guid>post-1</guid>
      <title>Winter grant round</title>
      <link>https://tahti.live/news/grants</link>
      <description>Member-voted grants are open again.</description>
      <enclosure url="https://cdn.example/grants.jpg" type="image/jpeg" />
    </item>
    <item>
      <title>No link item</title>
      <description>&lt;p&gt;HTML teaser&lt;/p&gt;</description>
      <media:thumbnail url="https://cdn.example/thumb.png" />
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Desk</title>
  <entry>
    <id>urn:post:2</id>
    <title>Atom headline</title>
    <link rel="alternate" href="https://tahti.live/news/atom" />
    <summary>Short atom summary</summary>
  </entry>
</feed>`;

describe('parseRssXml', () => {
  it('reads RSS 2.0 items, images, and teasers', () => {
    const feed = parseRssXml(RSS);
    expect(feed.title).toBe('Tahti News');
    expect(feed.items).toEqual([
      {
        id: 'post-1',
        title: 'Winter grant round',
        teaser: 'Member-voted grants are open again.',
        imageUrl: 'https://cdn.example/grants.jpg',
        link: 'https://tahti.live/news/grants',
        paragraphs: ['Member-voted grants are open again.'],
      },
      {
        id: 'No link item-1',
        title: 'No link item',
        teaser: 'HTML teaser',
        imageUrl: 'https://cdn.example/thumb.png',
        link: undefined,
        paragraphs: ['HTML teaser'],
      },
    ]);
  });

  it('reads Atom entries', () => {
    const feed = parseRssXml(ATOM);
    expect(feed.title).toBe('Atom Desk');
    expect(feed.items).toEqual([
      {
        id: 'urn:post:2',
        title: 'Atom headline',
        teaser: 'Short atom summary',
        imageUrl: undefined,
        link: 'https://tahti.live/news/atom',
        paragraphs: ['Short atom summary'],
      },
    ]);
  });

  it('reads the date and full-text paragraphs without markup', () => {
    const xml = `<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <item>
      <title>Studio diary</title>
      <pubDate>Tue, 20 Oct 2026 09:30:00 +0000</pubDate>
      <description>Short teaser</description>
      <content:encoded><![CDATA[<p>First <b>bold</b> line.</p><img src="x" onerror="alert(1)"><ul><li>One</li><li>Two</li></ul><script>alert(1)</script>]]></content:encoded>
    </item>
  </channel>
</rss>`;
    const [item] = parseRssXml(xml).items;
    expect(item?.publishedAt).toBe('2026-10-20T09:30:00.000Z');
    expect(item?.paragraphs).toEqual(['First bold line.', 'One', 'Two']);
    expect(item?.teaser).toBe('Short teaser');
  });

  it('reads pubDates with a European zone abbreviation', () => {
    const xml = `<rss><channel><item><title>T</title><pubDate>Tue, 20 Oct 2026 17:05:53 BST</pubDate></item></channel></rss>`;
    expect(parseRssXml(xml).items[0]?.publishedAt).toBe(
      '2026-10-20T16:05:53.000Z',
    );
  });

  it('splits plain-text descriptions on blank lines', () => {
    const xml = `<rss><channel><item><title>T</title><description>One

Two</description></item></channel></rss>`;
    expect(parseRssXml(xml).items[0]?.paragraphs).toEqual(['One', 'Two']);
  });

  it('returns no items for invalid XML', () => {
    expect(parseRssXml('<not-xml').items).toEqual([]);
  });
});

describe('isHttpUrl', () => {
  it('accepts http(s) and rejects other schemes', () => {
    expect(isHttpUrl('https://example.com/rss.xml')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});
