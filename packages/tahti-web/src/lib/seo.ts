export type RouteMetadata = {
  title: string;
  description: string;
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

export function metadataForPath(pathname: string): RouteMetadata {
  const channel = /^\/(?:channel|c)\/([^/]+)/.exec(pathname)?.[1];
  if (channel) {
    const name = displaySlug(channel);
    return {
      title: `${name} live on Tahti`,
      description: `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
    };
  }

  const artist = /^\/u\/([^/]+)/.exec(pathname)?.[1];
  if (artist) {
    const name = displaySlug(artist);
    return {
      title: `${name} on Tahti`,
      description: `Explore ${name}'s music, releases, collections, and live channel on Tahti.`,
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

  if (pathname.startsWith('/studio')) {
    return {
      title: 'Studio · Tahti',
      description:
        'Manage your music, channel, broadcasts, and audience on Tahti.',
    };
  }

  return DEFAULT_METADATA;
}

function setMeta(property: string, content: string): void {
  const selector = `meta[property="${property}"]`;
  const element = document.head.querySelector<HTMLMetaElement>(selector);
  element?.setAttribute('content', content);
}

export function syncDocumentMetadata(pathname: string): void {
  const metadata = metadataForPath(pathname);
  const canonicalUrl = new URL(pathname, window.location.origin).toString();
  document.title = metadata.title;
  document.head
    .querySelector<HTMLMetaElement>('meta[name="description"]')
    ?.setAttribute('content', metadata.description);
  setMeta('og:title', metadata.title);
  setMeta('og:description', metadata.description);
  setMeta('og:url', canonicalUrl);
  document.head
    .querySelector<HTMLLinkElement>('link[rel="canonical"]')
    ?.setAttribute('href', canonicalUrl);
}

export function scrollingPlaybackTitle(title: string, offset: number): string {
  const marquee = `${title}   `;
  const position = offset % marquee.length;
  return `${marquee.slice(position)}${marquee.slice(0, position)}`;
}
