import { useEffect, useMemo, useRef } from 'react';

import {
  fetchChannelBlocks,
  type PublicChannelBlock,
} from '../../api/channel-blocks';
import {
  fetchChannel,
  fetchChannelSound,
  fetchProfile,
} from '../../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../../api/disco-widgets';
import type { FetchMeta } from '../../api/mode';
import { RequestJsonError } from '../../api/request-json';
import { fetchPublicRadioShow, type PublicRadioShow } from '../../api/shows';
import type {
  ChannelSoundItem,
  PublicChannel,
  PublicProfile,
} from '../../api/types';
import {
  resolveStorefront,
  type ChannelStorefront,
} from '../../lib/channelStore';
import { syncDocumentMetadata } from '../../lib/seo';
import { apiResult, useSnapshotFetch } from '../../lib/useSnapshotFetch';
import { usePublishChannelChrome } from '../../stores/channelChromeStore';

export type ChannelSectionStatus = 'loading' | 'ready' | 'error';

export type ChannelSection = 'sounds' | 'widgets' | 'shows';

type SectionState<T> = { data: T; status: ChannelSectionStatus };

/** The API clients swallow request errors and return empty data with a
 * `reason`; mock-fallback data (`source: 'mock'`) is still usable. */
function failed(meta: FetchMeta): boolean {
  return meta.source === 'api' && Boolean(meta.reason);
}

/** Loads one secondary section of the channel page on its own, so a slow or
 * failed request only affects that section. Its last result per slug renders
 * at once and refreshes in the background; the status is `error` only when
 * nothing was saved. */
function useChannelSection<T>(
  name: string,
  slug: string,
  empty: T,
  load: (slug: string) => Promise<{ data: T; meta: FetchMeta }>,
): SectionState<T> & { retry: () => void } {
  const { data, loading, error, retry } = useSnapshotFetch<T>(
    `channel-${name}:${slug}`,
    async () => {
      const result = await load(slug);
      if (failed(result.meta)) {
        throw new Error(result.meta.reason);
      }
      return result.data;
    },
  );
  const status: ChannelSectionStatus = loading
    ? 'loading'
    : error !== null && data === null
      ? 'error'
      : 'ready';
  return { data: data ?? empty, status, retry };
}

const NO_SOUNDS: ChannelSoundItem[] = [];
const NO_WIDGETS: DiscoWidgetRenderItem[] = [];
const NO_BLOCKS: PublicChannelBlock[] = [];
const NO_LINKS: Record<string, string> = {};

/** Loads everything a channel page shows. The channel itself is the primary
 * content: `loading` covers only it, so the header and player render as soon
 * as the channel resolves while tracks, widgets and shows report their own
 * `sectionStatus`. Every part renders its last result for the slug at once
 * and refreshes in the background. `refreshKey` (bumped after look/link
 * saves) refetches only the channel. */
export function useChannelData(slug: string, refreshKey: number) {
  const main = useSnapshotFetch<PublicChannel | null>(
    `channel:${slug}`,
    async () => {
      try {
        return (await fetchChannel(slug)).data;
      } catch (err) {
        // Only a 404 means the channel does not exist; anything else is a
        // failed load worth retrying.
        if (err instanceof RequestJsonError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
  );
  const username = main.data?.user.username ?? null;
  // The follower count, links and store live on the artist profile. It shares
  // the artist page snapshot, and a failed lookup never blocks the page.
  const { data: profile, retry: retryProfile } =
    useSnapshotFetch<PublicProfile | null>(
      `artist-profile:${username ?? ''}`,
      async () => (username ? apiResult(await fetchProfile(username)) : null),
    );
  const shownRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (shownRefreshKey.current !== refreshKey) {
      shownRefreshKey.current = refreshKey;
      main.retry();
      retryProfile();
    }
  }, [refreshKey]);
  const artist = profile?.artist.username === username ? profile : null;

  const channel = useMemo(() => {
    if (!main.data || !artist) {
      return main.data;
    }
    return {
      ...main.data,
      followerCount: artist.artist.followerCount ?? null,
      followingCount: artist.artist.followingCount ?? null,
      publicPlays:
        artist.metrics?.playsTotal ??
        artist.totals?.plays ??
        main.data.publicPlays,
      metrics: artist.metrics,
    };
  }, [main.data, artist]);
  usePublishChannelChrome(channel);
  const artistSocialLinks = artist?.artist.socialLinks ?? NO_LINKS;
  const storefront = useMemo<ChannelStorefront | null>(
    () => (artist ? resolveStorefront(artist) : null),
    [artist],
  );

  const name = channel?.user.displayName;
  const bio = channel?.user.bio;
  const avatarUrl = channel?.user.avatarUrl;
  useEffect(() => {
    if (!name) {
      return;
    }
    syncDocumentMetadata(window.location.pathname, {
      title: `${name} live on Tahti`,
      description:
        bio ??
        `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
      image: avatarUrl ?? undefined,
    });
  }, [name, bio, avatarUrl]);

  const sounds = useChannelSection(
    'sounds',
    slug,
    NO_SOUNDS,
    fetchChannelSound,
  );
  const widgets = useChannelSection(
    'widgets',
    slug,
    NO_WIDGETS,
    fetchChannelDiscoWidgets,
  );
  // Reloads with the widgets; a failed read only drops the layout, and the
  // add-ons then render in the plain list.
  const blocks = useChannelSection(
    'blocks',
    slug,
    NO_BLOCKS,
    fetchChannelBlocks,
  );
  const shows = useChannelSection<PublicRadioShow | null>(
    'shows',
    slug,
    null,
    fetchPublicRadioShow,
  );

  const retrySection = (section: ChannelSection) => {
    if (section === 'sounds') {
      sounds.retry();
    } else if (section === 'widgets') {
      widgets.retry();
      blocks.retry();
    } else {
      shows.retry();
    }
  };

  return {
    channel,
    sounds: sounds.data,
    discoWidgets: widgets.data,
    channelBlocks: blocks.data,
    liveShows: shows.data,
    artistSocialLinks,
    storefront,
    loading: main.loading,
    channelFailed: main.error !== null && main.data === null,
    refreshError: main.data ? main.error : null,
    retryChannel: main.retry,
    sectionStatus: {
      sounds: sounds.status,
      widgets: widgets.status,
      shows: shows.status,
    } satisfies Record<ChannelSection, ChannelSectionStatus>,
    retrySection,
  };
}
