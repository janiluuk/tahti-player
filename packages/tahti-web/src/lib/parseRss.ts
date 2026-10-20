export type RssArticle = {
  id: string;
  title: string;
  teaser?: string;
  imageUrl?: string;
  link?: string;
  /** ISO date from pubDate / published / updated, when it parses. */
  publishedAt?: string;
  /** Plain-text paragraphs of the full entry (content:encoded, content or
   * description); never HTML. */
  paragraphs?: string[];
};

export type ParsedRssFeed = {
  title?: string;
  items: RssArticle[];
};

const MAX_ITEMS = 20;

function textContent(node: Element | null): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function childByLocalName(parent: Element, localName: string): Element | null {
  return (
    Array.from(parent.children).find(
      (child) => child.localName.toLowerCase() === localName.toLowerCase(),
    ) ?? null
  );
}

function attrByLocalName(
  parent: Element,
  localName: string,
  attr: string,
): string | undefined {
  const node = childByLocalName(parent, localName);
  const value = node?.getAttribute(attr)?.trim();
  return value || undefined;
}

function firstImageUrl(item: Element): string | undefined {
  const thumbnail = attrByLocalName(item, 'thumbnail', 'url');
  if (thumbnail) {
    return thumbnail;
  }
  const itunesImage = attrByLocalName(item, 'image', 'href');
  if (itunesImage) {
    return itunesImage;
  }
  const enclosure = childByLocalName(item, 'enclosure');
  const enclosureType = enclosure?.getAttribute('type') ?? '';
  const enclosureUrl = enclosure?.getAttribute('url')?.trim();
  if (enclosureUrl && enclosureType.startsWith('image/')) {
    return enclosureUrl;
  }
  const mediaContent = Array.from(item.children).find((child) => {
    if (child.localName.toLowerCase() !== 'content') {
      return false;
    }
    const medium = child.getAttribute('medium') ?? '';
    const type = child.getAttribute('type') ?? '';
    return medium === 'image' || type.startsWith('image/');
  });
  const mediaUrl = mediaContent?.getAttribute('url')?.trim();
  if (mediaUrl) {
    return mediaUrl;
  }
  const html =
    childByLocalName(item, 'description') ?? childByLocalName(item, 'summary');
  const htmlText = html?.textContent ?? '';
  const img = /<img[^>]+src=["']([^"']+)["']/i.exec(htmlText);
  return img?.[1];
}

function itemLink(item: Element): string | undefined {
  const links = Array.from(item.children).filter(
    (child) => child.localName.toLowerCase() === 'link',
  );
  const hrefLink = links.find((link) => link.getAttribute('href')?.trim());
  if (hrefLink) {
    const rel = hrefLink.getAttribute('rel');
    if (!rel || rel === 'alternate') {
      return hrefLink.getAttribute('href')?.trim();
    }
  }
  const anyHref = links.find((link) => link.getAttribute('href')?.trim());
  if (anyHref) {
    return anyHref.getAttribute('href')?.trim();
  }
  const textLink = links.find((link) => textContent(link));
  return textLink ? textContent(textLink) : undefined;
}

function teaserFrom(item: Element): string | undefined {
  const raw =
    textContent(childByLocalName(item, 'description')) ||
    textContent(childByLocalName(item, 'summary')) ||
    textContent(childByLocalName(item, 'content'));
  if (!raw) {
    return undefined;
  }
  const stripped = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped || undefined;
}

const MAX_PARAGRAPHS = 40;

const ZONE_OFFSETS: Record<string, string> = {
  BST: '+0100',
  CET: '+0100',
  CEST: '+0200',
  EET: '+0200',
  EEST: '+0300',
};

function publishedAtFrom(item: Element): string | undefined {
  const raw =
    textContent(childByLocalName(item, 'pubDate')) ||
    textContent(childByLocalName(item, 'published')) ||
    textContent(childByLocalName(item, 'updated')) ||
    textContent(childByLocalName(item, 'date'));
  const time = raw
    ? Date.parse(
        raw.replace(
          /\b(BST|CEST|CET|EEST|EET)$/,
          (zone) => ZONE_OFFSETS[zone] ?? zone,
        ),
      )
    : Number.NaN;
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

function paragraphsFrom(item: Element): string[] | undefined {
  const source =
    childByLocalName(item, 'encoded') ??
    childByLocalName(item, 'content') ??
    childByLocalName(item, 'description') ??
    childByLocalName(item, 'summary');
  const raw = source?.textContent?.trim();
  if (!raw) {
    return undefined;
  }
  const html = new DOMParser().parseFromString(raw, 'text/html');
  const blocks = Array.from(
    html.body.querySelectorAll('p, li, h2, h3, h4, blockquote'),
  )
    .filter((node) => !node.parentElement?.closest('p, li, blockquote'))
    .map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim());
  const paragraphs = (
    blocks.length > 0
      ? blocks
      : (html.body.textContent ?? '')
          .split(/\n\s*\n/)
          .map((part) => part.replace(/\s+/g, ' ').trim())
  )
    .filter(Boolean)
    .slice(0, MAX_PARAGRAPHS);
  return paragraphs.length > 0 ? paragraphs : undefined;
}

function parseItems(elements: Element[]): RssArticle[] {
  return elements.slice(0, MAX_ITEMS).flatMap((item, index) => {
    const title = textContent(childByLocalName(item, 'title'));
    if (!title) {
      return [];
    }
    const link = itemLink(item);
    const guid =
      textContent(childByLocalName(item, 'guid')) ||
      textContent(childByLocalName(item, 'id')) ||
      link ||
      `${title}-${index}`;
    return [
      {
        id: guid,
        title,
        teaser: teaserFrom(item),
        imageUrl: firstImageUrl(item),
        link,
        publishedAt: publishedAtFrom(item),
        paragraphs: paragraphsFrom(item),
      },
    ];
  });
}

export function parseRssXml(xml: string): ParsedRssFeed {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) {
    return { items: [] };
  }
  const channel = doc.querySelector('channel');
  const feed = doc.querySelector('feed');
  const title = textContent(
    (channel ?? feed)?.querySelector(':scope > title') ??
      childByLocalName(channel ?? feed ?? doc.documentElement, 'title'),
  );
  const rssItems = Array.from(doc.getElementsByTagName('item'));
  const atomEntries = Array.from(doc.getElementsByTagName('entry'));
  return {
    title: title || undefined,
    items: parseItems(rssItems.length > 0 ? rssItems : atomEntries),
  };
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
