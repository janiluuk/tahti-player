export type RouteMetadata = {
  title: string;
  description: string;
  image?: string;
};

const DEFAULT_METADATA: RouteMetadata = {
  title: 'Tahti · Independent music, live',
  description:
    'Listen to independent artists, live channels, radio, and lossless releases on Tahti.',
};

function displaySlug(value: string): string {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const PAGE_TITLES: [string, string][] = [
  ['/discover', 'Discover'],
  ['/favorites', 'Favorites'],
  ['/listen/favorites', 'Favorites'],
  ['/library/favorites', 'Favorites'],
  ['/feed', 'Feed'],
  ['/listen/feed', 'Feed'],
  ['/history', 'History'],
  ['/listen/history', 'History'],
  ['/library/history', 'History'],
  ['/library/sounds', 'Tracks'],
  ['/library/smartlinks', 'Smart links'],
  ['/library/local', 'Local files'],
  ['/messages', 'Messages'],
  ['/governance/feature-requests', 'Feature requests'],
  ['/governance/history', 'Closed decisions'],
  ['/governance/members', 'Member directory'],
  ['/governance', 'Governance'],
  ['/transparency', 'Transparency'],
  ['/help', 'Help'],
  ['/news', 'Platform news'],
  ['/whats-new', 'What’s new'],
  ['/schedule', 'Schedule'],
  ['/search', 'Search'],
  ['/settings', 'Settings'],
  ['/venues', 'Venues'],
  ['/chat', 'Chat'],
  ['/status', 'Status'],
  ['/more', 'Tahti map'],
];

const SECTION_NAMES: [string, string][] = [
  ['/studio', 'Studio'],
  ['/admin', 'Admin'],
  ['/library', 'Library'],
];

function sentenceCase(value: string): string {
  const words = decodeURIComponent(value).split('-').filter(Boolean).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function pageTitleForPath(pathname: string): string | null {
  const page = PAGE_TITLES.find(([prefix]) => matchesPrefix(pathname, prefix));
  if (page) {
    return `${page[1]} · Tahti`;
  }
  const section = SECTION_NAMES.find(([prefix]) =>
    matchesPrefix(pathname, prefix),
  );
  if (!section) {
    return null;
  }
  const child = pathname.slice(section[0].length).split('/').filter(Boolean)[0];
  return child
    ? `${sentenceCase(child)} · ${section[1]} · Tahti`
    : `${section[1]} · Tahti`;
}

export function metadataForPath(pathname: string): RouteMetadata {
  const channel = /^\/(?:channel|c)\/([^/]+)/.exec(pathname)?.[1];
  if (channel) {
    const name = displaySlug(channel);
    return {
      title: `${name} live on Tahti`,
      description: `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
    };
  }

  const artist = /^\/u\/([^/]+)\/c\/([^/]+)/.exec(pathname);
  if (artist) {
    const collection = displaySlug(artist[2] ?? '');
    const owner = displaySlug(artist[1] ?? '');
    return {
      title: `${collection} by ${owner} on Tahti`,
      description: `Listen to ${collection}, a collection by ${owner} on Tahti.`,
    };
  }

  const profile = /^\/u\/([^/]+)/.exec(pathname)?.[1];
  if (profile) {
    const name = displaySlug(profile);
    return {
      title: `${name} on Tahti`,
      description: `Explore ${name}'s music, releases, collections, and live channel on Tahti.`,
    };
  }

  const venue = /^\/v\/([^/]+)/.exec(pathname)?.[1];
  if (venue) {
    const name = displaySlug(venue);
    return {
      title: `${name} on Tahti`,
      description: `${name} is a verified venue on Tahti.`,
    };
  }

  const release = /^\/r\/([^/]+)/.exec(pathname)?.[1];
  if (release) {
    const name = displaySlug(release);
    return {
      title: `${name} on Tahti`,
      description: `Listen to ${name} and find its official links on Tahti.`,
    };
  }

  if (pathname.startsWith('/radio')) {
    return {
      title: 'Tahti Radio',
      description: 'Listen to the cooperative Tahti Radio stream and schedule.',
    };
  }

  const pageTitle = pageTitleForPath(pathname);
  if (pathname.startsWith('/studio')) {
    return {
      title: pageTitle ?? 'Studio · Tahti',
      description:
        'Manage your music, channel, broadcasts, and audience on Tahti.',
    };
  }

  if (pageTitle) {
    return { ...DEFAULT_METADATA, title: pageTitle };
  }

  return DEFAULT_METADATA;
}

function setMeta(property: string, content: string): void {
  const selector = `meta[property="${property}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  element?.setAttribute('content', content);
}

let lastApplied: (RouteMetadata & { pathname: string }) | null = null;

function applyMetadata(pathname: string, metadata: RouteMetadata): void {
  const canonicalUrl = new URL(pathname, window.location.origin).toString();
  document.title = metadata.title;
  document.head
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.setAttribute('content', metadata.description);
  setMeta('og:title', metadata.title);
  setMeta('og:description', metadata.description);
  setMeta('og:url', canonicalUrl);
  if (metadata.image) {
    setMeta('og:image', metadata.image);
  }
  document.head
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.setAttribute('href', canonicalUrl);
  lastApplied = { ...metadata, pathname };
}

/**
 * Sets document metadata for a route. Pass `overrides` once a view's own
 * data fetch resolves (real display name/bio/artwork) to replace the
 * slug-guessed defaults from `metadataForPath` — routes have no router
 * loaders, so this is always a two-step sync: guess on route entry, then
 * real data shortly after.
 */
export function syncDocumentMetadata(
  pathname: string,
  overrides?: Partial<RouteMetadata>,
): void {
  const metadata = { ...metadataForPath(pathname), ...overrides };
  applyMetadata(pathname, metadata);
}

/**
 * Re-applies whatever metadata was last synced for this pathname (guess or
 * real-data override) rather than recomputing the slug guess — used when
 * something else (the scrolling now-playing title) temporarily took over
 * document.title and needs to hand it back without discarding an override.
 */
export function reapplyLastMetadata(pathname: string): void {
  if (lastApplied && lastApplied.pathname === pathname) {
    applyMetadata(pathname, lastApplied);
  } else {
    syncDocumentMetadata(pathname);
  }
}

export function scrollingPlaybackTitle(title: string, offset: number): string {
  const marquee = `${title}   `;
  const position = offset % marquee.length;
  return `${marquee.slice(position)}${marquee.slice(0, position)}`;
}
