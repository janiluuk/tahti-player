import { useEffect, useState } from 'react';

import {
  fetchChannel,
  fetchChannelSound,
  fetchProfile,
} from '../../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../../api/disco-widgets';
import { fetchPublicRadioShow, type PublicRadioShow } from '../../api/shows';
import type { ChannelSoundItem, PublicChannel } from '../../api/types';
import { syncDocumentMetadata } from '../../lib/seo';

/** Loads everything a channel page shows. `refreshKey` refetches in the
 * background: the page keeps rendering the previous data, so a look save
 * doesn't tear down the whole page (and the designer inside it) behind a
 * full-page spinner. Only a slug change shows the loading state. */
export function useChannelData(slug: string, refreshKey: number) {
  const [channel, setChannel] = useState<PublicChannel | null>(null);
  const [sounds, setSounds] = useState<ChannelSoundItem[]>([]);
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [liveShows, setLiveShows] = useState<PublicRadioShow | null>(null);
  const [artistSocialLinks, setArtistSocialLinks] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchChannel(slug),
      fetchChannelSound(slug),
      fetchChannelDiscoWidgets(slug),
      fetchPublicRadioShow(slug),
    ])
      .then(([ch, items, widgets, shows]) => {
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
        setSounds(items.data);
        setDiscoWidgets(widgets.data);
        setLiveShows(shows.data);

        const name = ch.data.user.displayName;
        syncDocumentMetadata(window.location.pathname, {
          title: `${name} live on Tahti`,
          description:
            ch.data.user.bio ??
            `Listen to ${name}'s live channel, archive, and programme on Tahti.`,
          image: ch.data.user.avatarUrl ?? undefined,
        });

        // The Stats block needs a real follower count, which lives on the
        // artist profile rather than the channel itself — fetched
        // separately so a slow/failed profile lookup never blocks the
        // channel page from rendering.
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

  return {
    channel,
    sounds,
    discoWidgets,
    liveShows,
    artistSocialLinks,
    loading,
  };
}
