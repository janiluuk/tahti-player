import { useCallback, useEffect, useState } from 'react';

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
import { fetchPublicRadioShow, type PublicRadioShow } from '../../api/shows';
import type { ChannelSoundItem, PublicChannel } from '../../api/types';
import { syncDocumentMetadata } from '../../lib/seo';

export type ChannelSectionStatus = 'loading' | 'ready' | 'error';

export type ChannelSection = 'sounds' | 'widgets' | 'shows';

type SectionState<T> = { data: T; status: ChannelSectionStatus };

/** The API clients swallow request errors and return empty data with a
 * `reason`; mock-fallback data (`source: 'mock'`) is still usable. */
function failed(meta: FetchMeta): boolean {
  return meta.source === 'api' && Boolean(meta.reason);
}

/** Loads one secondary section of the channel page on its own, so a slow or
 * failed request only affects that section. Refetches on `slug` or `reloadKey`
 * change, clearing stale data only when the slug changes. */
function useChannelSection<T>(
  slug: string,
  reloadKey: number,
  empty: T,
  load: (slug: string) => Promise<{ data: T; meta: FetchMeta }>,
): SectionState<T> {
  const [state, setState] = useState<SectionState<T> & { slug: string }>({
    slug,
    data: empty,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    setState((prev) =>
      prev.slug === slug
        ? { ...prev, status: prev.status === 'error' ? 'loading' : prev.status }
        : { slug, data: empty, status: 'loading' },
    );
    load(slug)
      .then((result) => {
        if (!cancelled) {
          setState({
            slug,
            data: result.data,
            status: failed(result.meta) ? 'error' : 'ready',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ slug, data: empty, status: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
    // `empty` and `load` are module-level constants at every call site.
  }, [slug, reloadKey]);

  return state.slug === slug ? state : { data: empty, status: 'loading' };
}

const NO_SOUNDS: ChannelSoundItem[] = [];
const NO_WIDGETS: DiscoWidgetRenderItem[] = [];

/** Loads everything a channel page shows. The channel itself is the primary
 * content: `loading` covers only it, so the header and player render as soon
 * as the channel resolves while tracks, widgets and shows report their own
 * `sectionStatus`. `refreshKey` (bumped after look/link saves) refetches only
 * the channel, in the background, so a save doesn't tear the page down
 * behind a full-page spinner. */
export function useChannelData(slug: string, refreshKey: number) {
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [artistSocialLinks, setArtistSocialLinks] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [reloadKeys, setReloadKeys] = useState<Record<ChannelSection, number>>({
    sounds: 0,
    widgets: 0,
    shows: 0,
  });

  useEffect(() => {
    setLoading(true);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void fetchChannel(slug)
      .then((ch) => {
        if (cancelled) {
          return;
        }
        // Keep the follower count while the profile lookup below refreshes.
        setChannel((prev) => ({
          ...ch.data,
          followerCount:
            ch.data.followerCount ??
            (prev?.slug === ch.data.slug ? prev.followerCount : undefined),
        }));

        const name = ch.data.user.displayName;
        syncDocumentMetadata(window.location.pathname, {
          title: `${name} live on Tahti`,
          description:
            ch.data.user.bio ??
            `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
          image: ch.data.user.avatarUrl ?? undefined,
        });

        // The follower count lives on the artist profile rather than the
        // channel itself; a slow/failed lookup must never block the page.
        void fetchProfile(ch.data.user.username)
          .then((profile) => {
            if (cancelled) {
              return;
            }
            setChannel((current) =>
              current
                ? {
                    ...current,
                    followerCount: profile.data.artist.followerCount ?? null,
                  }
                : current,
            );
            setArtistSocialLinks(profile.data.artist.socialLinks ?? {});
          })
          .catch(() => {});
      })
      .catch(() => {
        // Leaves the previous data in place; a first load with no data
        // falls through to "Channel not found".
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, refreshKey]);

  const sounds = useChannelSection(
    slug,
    reloadKeys.sounds,
    NO_SOUNDS,
    fetchChannelSound,
  );
  const widgets = useChannelSection(
    slug,
    reloadKeys.widgets,
    NO_WIDGETS,
    fetchChannelDiscoWidgets,
  );
  const shows = useChannelSection<PublicRadioShow | null>(
    slug,
    reloadKeys.shows,
    null,
    fetchPublicRadioShow,
  );

  const retrySection = useCallback((section: ChannelSection) => {
    setReloadKeys((keys) => ({ ...keys, [section]: keys[section] + 1 }));
  }, []);

  return {
    channel,
    sounds: sounds.data,
    discoWidgets: widgets.data,
    liveShows: shows.data,
    artistSocialLinks,
    loading,
    sectionStatus: {
      sounds: sounds.status,
      widgets: widgets.status,
      shows: shows.status,
    } satisfies Record<ChannelSection, ChannelSectionStatus>,
    retrySection,
  };
}
