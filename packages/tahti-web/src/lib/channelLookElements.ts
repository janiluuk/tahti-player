import {
  CHANNEL_PAGE_ITEM_META,
  type ChannelPageItemType,
} from './channelPageLayout';

export type ChannelLookElementId =
  | 'releases'
  | 'tracks'
  | 'latest'
  | 'feed'
  | 'news'
  | 'player'
  | 'bio'
  | 'shows'
  | 'gallery'
  | 'backdrop';

export type ArtistLookBlockId = Exclude<ChannelLookElementId, 'backdrop'>;

export type ChannelLookElement = {
  id: ChannelLookElementId;
  label: string;
  hint: string;
  layoutType: ChannelPageItemType | null;
  canDisable: boolean;
};

export const CHANNEL_LOOK_ELEMENTS: readonly ChannelLookElement[] = [
  {
    id: 'releases',
    label: 'Releases',
    hint: 'Full discography on the artist page.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'tracks',
    label: 'Tracks',
    hint: CHANNEL_PAGE_ITEM_META.sound.hint,
    layoutType: 'sound',
    canDisable: true,
  },
  {
    id: 'latest',
    label: 'Latest',
    hint: 'Newest releases highlighted on the music tab.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'feed',
    label: 'Feed',
    hint: 'Artist updates and credits on the public page.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'news',
    label: 'News',
    hint: 'Pinned channel announcements.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'player',
    label: 'Player',
    hint: 'Live stage, visualizer, gradient, and now-playing overlay.',
    layoutType: 'hero',
    canDisable: true,
  },
  {
    id: 'bio',
    label: 'Bio & widgets',
    hint: 'Full bio, disco widgets, and studio links on the artist page.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'shows',
    label: 'Live shows',
    hint: 'Upcoming and past Tahti Radio broadcasts.',
    layoutType: 'events',
    canDisable: true,
  },
  {
    id: 'gallery',
    label: 'Gallery',
    hint: 'Press-kit image gallery tab on the artist page.',
    layoutType: null,
    canDisable: true,
  },
  {
    id: 'backdrop',
    label: 'Background',
    hint: 'Page banner, header style, and colors behind the channel.',
    layoutType: null,
    canDisable: false,
  },
];

export const DEFAULT_ARTIST_LOOK_VISIBILITY: Record<
  ArtistLookBlockId,
  boolean
> = {
  releases: true,
  tracks: true,
  latest: true,
  feed: true,
  news: true,
  player: true,
  bio: true,
  shows: true,
  gallery: true,
};

export function isChannelLookElementId(
  value: string | null | undefined,
): value is ChannelLookElementId {
  return CHANNEL_LOOK_ELEMENTS.some((element) => element.id === value);
}

export function isArtistLookBlockId(
  value: string | null | undefined,
): value is ArtistLookBlockId {
  return (
    isChannelLookElementId(value) &&
    CHANNEL_LOOK_ELEMENTS.find((element) => element.id === value)
      ?.canDisable === true
  );
}

export function adjacentLookElementId(
  currentId: string,
  direction: -1 | 1,
): ChannelLookElementId {
  const ids = CHANNEL_LOOK_ELEMENTS.map((element) => element.id);
  const index = ids.indexOf(currentId as ChannelLookElementId);
  const from = index < 0 ? 0 : index;
  const next = (from + direction + ids.length) % ids.length;
  return ids[next] ?? 'releases';
}

function artistLookStorageKey(slug: string) {
  return `tahti.artistLookBlocks.${slug}`;
}

export function loadArtistLookVisibility(
  slug: string,
): Record<ArtistLookBlockId, boolean> {
  if (!slug) {
    return { ...DEFAULT_ARTIST_LOOK_VISIBILITY };
  }
  try {
    const raw = localStorage.getItem(artistLookStorageKey(slug));
    if (!raw) {
      return { ...DEFAULT_ARTIST_LOOK_VISIBILITY };
    }
    const parsed = JSON.parse(raw) as Partial<
      Record<ArtistLookBlockId, boolean>
    >;
    return {
      ...DEFAULT_ARTIST_LOOK_VISIBILITY,
      ...Object.fromEntries(
        Object.entries(parsed).filter(([key]) => isArtistLookBlockId(key)),
      ),
    };
  } catch {
    return { ...DEFAULT_ARTIST_LOOK_VISIBILITY };
  }
}

export function saveArtistLookVisibility(
  slug: string,
  visibility: Record<ArtistLookBlockId, boolean>,
): void {
  if (!slug) {
    return;
  }
  try {
    localStorage.setItem(
      artistLookStorageKey(slug),
      JSON.stringify(visibility),
    );
  } catch {
    return;
  }
}

export function toggleArtistLookVisibility(
  slug: string,
  id: ArtistLookBlockId,
): Record<ArtistLookBlockId, boolean> {
  const current = loadArtistLookVisibility(slug);
  const next = { ...current, [id]: !current[id] };
  saveArtistLookVisibility(slug, next);
  return next;
}
