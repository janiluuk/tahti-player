import type { TFunction } from '@tahti-player/i18n';

import {
  CHANNEL_PAGE_ITEM_META,
  type ChannelPageItemType,
} from './channelPageLayout';
import { webT } from './webT';

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

export function channelLookElements(
  t: TFunction<'web'>,
): readonly ChannelLookElement[] {
  return [
    {
      id: 'releases',
      label: t('channelLookElements.releases'),
      hint: t('channelLookElements.fullDiscographyOnTheArtist'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'tracks',
      label: t('channelLookElements.tracks'),
      hint: CHANNEL_PAGE_ITEM_META.sound.hint,
      layoutType: 'sound',
      canDisable: true,
    },
    {
      id: 'latest',
      label: t('channelLookElements.latest'),
      hint: t('channelLookElements.newestReleasesHighlightedOnThe'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'feed',
      label: t('channelLookElements.feed'),
      hint: t('channelLookElements.artistUpdatesAndCreditsOn'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'news',
      label: t('channelLookElements.news'),
      hint: t('channelLookElements.pinnedChannelAnnouncements'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'player',
      label: t('channelLookElements.player'),
      hint: t('channelLookElements.liveStageVisualizerGradientAnd'),
      layoutType: 'hero',
      canDisable: true,
    },
    {
      id: 'bio',
      label: t('channelLookElements.bioWidgets'),
      hint: t('channelLookElements.fullBioDiscoWidgetsAnd'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'shows',
      label: t('channelLookElements.liveShows'),
      hint: t('channelLookElements.upcomingAndPastTahtiRadio'),
      layoutType: 'events',
      canDisable: true,
    },
    {
      id: 'gallery',
      label: t('channelLookElements.gallery'),
      hint: t('channelLookElements.pressKitImageGalleryTab'),
      layoutType: null,
      canDisable: true,
    },
    {
      id: 'backdrop',
      label: t('channelLookElements.background'),
      hint: t('channelLookElements.pageBannerHeaderStyleAnd'),
      layoutType: null,
      canDisable: false,
    },
  ];
}

const DEFAULT_ARTIST_LOOK_VISIBILITY: Record<ArtistLookBlockId, boolean> = {
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
  return channelLookElements(webT()).some((element) => element.id === value);
}

export function isArtistLookBlockId(
  value: string | null | undefined,
): value is ArtistLookBlockId {
  return (
    isChannelLookElementId(value) &&
    channelLookElements(webT()).find((element) => element.id === value)
      ?.canDisable === true
  );
}

export function adjacentLookElementId(
  currentId: string,
  direction: -1 | 1,
): ChannelLookElementId {
  const ids = channelLookElements(webT()).map((element) => element.id);
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
