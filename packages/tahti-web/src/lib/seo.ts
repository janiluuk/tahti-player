import { i18n, type ParseKeys } from '@tahti-player/i18n';

export type RouteMetadata = {
  title: string;
  description: string;
  image?: string;
};

function defaultMetadata(): RouteMetadata {
  return {
    title: i18n.t('web:seo.defaultTitle'),
    description: i18n.t('web:seo.defaultDescription'),
  };
}

function displaySlug(value: string): string {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const PAGE_TITLE_KEYS: [string, ParseKeys<'web'>][] = [
  ['/discover', 'seo.discover'],
  ['/favorites', 'seo.favorites'],
  ['/listen/favorites', 'seo.favorites'],
  ['/feed', 'seo.feed'],
  ['/notifications', 'seo.notifications'],
  ['/listen/feed', 'seo.feed'],
  ['/history', 'seo.history'],
  ['/listen/history', 'seo.history'],
  ['/messages', 'seo.messages'],
  ['/governance/feature-requests', 'seo.featureRequests'],
  ['/governance/history', 'seo.closedDecisions'],
  ['/governance/members', 'seo.memberDirectory'],
  ['/governance', 'seo.governance'],
  ['/transparency', 'seo.transparency'],
  ['/help', 'seo.help'],
  ['/news', 'seo.platformNews'],
  ['/whats-new', 'seo.whatsNew'],
  ['/schedule', 'seo.schedule'],
  ['/search', 'seo.search'],
  ['/settings', 'seo.settings'],
  ['/venues', 'seo.venues'],
  ['/chat', 'seo.chat'],
  ['/status', 'seo.status'],
  ['/more', 'seo.tahtiMap'],
  ['/about', 'seo.about'],
  ['/what-is-it', 'seo.whatIsIt'],
  ['/how-it-works', 'seo.howItWorks'],
  ['/for-artists', 'seo.forArtists'],
  ['/terms', 'seo.termsOfService'],
  ['/privacy', 'seo.privacyPolicy'],
  ['/agpl', 'seo.agpl'],
  ['/subscribe', 'seo.subscribe'],
  ['/newsletter', 'seo.newsletter'],
  ['/moderate', 'seo.chatModeration'],
  ['/jam', 'seo.jam'],
];

const LIBRARY_PAGE_TITLE_KEYS: [string, ParseKeys<'web'>][] = [
  ['/library/favorites', 'library.tabFavorites'],
  ['/library/history', 'library.tabHistory'],
  ['/library/following', 'library.tabFollowing'],
  ['/library/sounds', 'library.tabSounds'],
  ['/library/smartlinks', 'library.tabSmartLinks'],
  ['/library/local', 'library.tabLocal'],
];

const SECTION_NAME_KEYS: [string, ParseKeys<'web'>][] = [
  ['/studio', 'seo.studio'],
  ['/admin', 'seo.admin'],
];

function librarySectionTitle(): string {
  return i18n.t('web:nav.library');
}

function sentenceCase(value: string): string {
  const words = decodeURIComponent(value).split('-').filter(Boolean).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function camelSlug(value: string): string {
  return decodeURIComponent(value)
    .split('-')
    .filter(Boolean)
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join('');
}

function childTitle(child: string, keyFor: (camel: string) => string): string {
  const camel = camelSlug(child);
  const key = keyFor(camel);
  return camel && i18n.exists(`web:${key}`)
    ? i18n.t(`web:${key}` as 'web:nav.library')
    : sentenceCase(child);
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function pageTitleForPath(pathname: string): string | null {
  const libraryPage = LIBRARY_PAGE_TITLE_KEYS.find(([prefix]) =>
    matchesPrefix(pathname, prefix),
  );
  if (libraryPage) {
    return `${i18n.t(`web:${libraryPage[1]}`)} · Tahti`;
  }
  if (matchesPrefix(pathname, '/library')) {
    const child = pathname
      .slice('/library'.length)
      .split('/')
      .filter(Boolean)[0];
    const section = librarySectionTitle();
    return child
      ? `${childTitle(child, (camel) => `library.tab${camel.charAt(0).toUpperCase()}${camel.slice(1)}`)} · ${section} · Tahti`
      : `${section} · Tahti`;
  }
  const page = PAGE_TITLE_KEYS.find(([prefix]) =>
    matchesPrefix(pathname, prefix),
  );
  if (page) {
    return `${i18n.t(`web:${page[1]}`)} · Tahti`;
  }
  const sectionEntry = SECTION_NAME_KEYS.find(([prefix]) =>
    matchesPrefix(pathname, prefix),
  );
  if (!sectionEntry) {
    return null;
  }
  const section = i18n.t(`web:${sectionEntry[1]}`);
  const child = pathname
    .slice(sectionEntry[0].length)
    .split('/')
    .filter(Boolean)[0];
  const childNamespace = sectionEntry[0] === '/admin' ? 'adminPages' : 'studio';
  return child
    ? `${childTitle(child, (camel) => `${childNamespace}.${camel}`)} · ${section} · Tahti`
    : `${section} · Tahti`;
}

export function metadataForPath(pathname: string): RouteMetadata {
  const channel = /^\/(?:channel|c)\/([^/]+)/.exec(pathname)?.[1];
  if (channel) {
    const name = displaySlug(channel);
    return {
      title: i18n.t('web:seo.channelTitle', { name }),
      description: i18n.t('web:seo.channelDescription', { name }),
    };
  }

  const artist = /^\/u\/([^/]+)\/c\/([^/]+)/.exec(pathname);
  if (artist) {
    const collection = displaySlug(artist[2] ?? '');
    const owner = displaySlug(artist[1] ?? '');
    return {
      title: i18n.t('web:seo.collectionTitle', { collection, owner }),
      description: i18n.t('web:seo.collectionDescription', {
        collection,
        owner,
      }),
    };
  }

  const profile = /^\/u\/([^/]+)/.exec(pathname)?.[1];
  if (profile) {
    const name = displaySlug(profile);
    return {
      title: i18n.t('web:seo.onTahti', { name }),
      description: i18n.t('web:seo.profileDescription', { name }),
    };
  }

  const venue = /^\/v\/([^/]+)/.exec(pathname)?.[1];
  if (venue) {
    const name = displaySlug(venue);
    return {
      title: i18n.t('web:seo.onTahti', { name }),
      description: i18n.t('web:seo.venueDescription', { name }),
    };
  }

  const release = /^\/r\/([^/]+)/.exec(pathname)?.[1];
  if (release) {
    const name = displaySlug(release);
    return {
      title: i18n.t('web:seo.onTahti', { name }),
      description: i18n.t('web:seo.releaseDescription', { name }),
    };
  }

  const subscribe = /^\/subscribe\/([^/]+)/.exec(pathname)?.[1];
  if (subscribe) {
    const name = displaySlug(subscribe);
    return {
      title: i18n.t('web:seo.subscribeTitle', { name }),
      description: i18n.t('web:seo.subscribeDescription', { name }),
    };
  }

  const moderated = /^\/moderate\/([^/]+)/.exec(pathname)?.[1];
  if (moderated) {
    return {
      ...defaultMetadata(),
      title: i18n.t('web:seo.moderateTitle', { name: displaySlug(moderated) }),
    };
  }

  if (pathname.startsWith('/radio')) {
    return {
      title: i18n.t('web:seo.radioTitle'),
      description: i18n.t('web:seo.radioDescription'),
    };
  }

  const pageTitle = pageTitleForPath(pathname);
  if (pathname.startsWith('/studio')) {
    return {
      title: pageTitle ?? i18n.t('web:seo.studioTitle'),
      description: i18n.t('web:seo.studioDescription'),
    };
  }

  if (pageTitle) {
    return { ...defaultMetadata(), title: pageTitle };
  }

  return defaultMetadata();
}

function setMeta(property: string, content: string): void {
  const selector = `meta[property="${property}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  element?.setAttribute('content', content);
}

let lastApplied: (RouteMetadata & { pathname: string }) | null = null;
let playbackTitle: string | null = null;

function applyMetadata(pathname: string, metadata: RouteMetadata): void {
  const canonicalUrl = new URL(pathname, window.location.origin).toString();
  document.title = playbackTitle ?? metadata.title;
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
 * Shows `title` in the tab and window title in place of the page's own
 * until called with null, which puts the page's last synced title back.
 * Page metadata synced in between keeps its share and Open Graph tags.
 */
export function setPlaybackDocumentTitle(title: string | null): void {
  playbackTitle = title;
  document.title = title ?? lastApplied?.title ?? document.title;
}

/** The tab and window title while something plays: what is on, then who
 * plays it, without repeating a name that is both. */
export function playbackDocumentTitle(title: string, artist: string): string {
  const what = title.trim();
  const who = artist.trim();
  const line =
    who && who.toLowerCase() !== what.toLowerCase()
      ? `${what} — ${who}`
      : what || who;
  return `▶ ${line} · Tahti`;
}
