import { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchPinnedAnnouncements,
  type PinnedAnnouncement,
} from '../../api/announcements';
import {
  channelLookExtrasFromVisual,
  resolveChannelLookExtras,
  type ChannelLookExtras,
} from '../../api/channel-design';
import { fetchChannel } from '../../api/client';
import {
  fetchChannelDiscoWidgets,
  type DiscoWidgetRenderItem,
} from '../../api/disco-widgets';
import { fetchPublicRadioShow, type PublicRadioShow } from '../../api/shows';
import { fetchChannelPosts, type ArtistPost } from '../../api/studio-extras';
import type { PublicChannel } from '../../api/types';
import {
  loadArtistLookVisibility,
  resolveArtistLookVisibility,
  type ArtistLookBlockId,
} from '../../lib/channelLookElements';
import { uploadLocalArtistLookVisibilityOnce } from '../../lib/persistArtistLookVisibility';

export type ArtistChannelVisual = Pick<
  PublicChannel,
  | 'visualPreset'
  | 'visualSettingsJson'
  | 'colorScheme'
  | 'colorSchemeJson'
  | 'headerStyle'
  | 'brandAccentPreset'
  | 'hlsUrl'
  | 'videoBackgroundUrl'
  | 'slideshowImages'
  | 'nowPlayingOverlayStyle'
  | 'nowPlayingOverlaySettingsJson'
  | 'playerOverlayMode'
  | 'playerOverlayText'
  | 'playerOverlayAlign'
  | 'usePlayerGradient'
  | 'playerColorSchemeJson'
  | 'useBackgroundGradient'
  | 'backgroundColorSchemeJson'
  | 'backgroundVisualPreset'
>;

export function pickChannelVisual(data: PublicChannel): ArtistChannelVisual {
  return {
    visualPreset: data.visualPreset,
    visualSettingsJson: data.visualSettingsJson,
    colorScheme: data.colorScheme,
    colorSchemeJson: data.colorSchemeJson,
    headerStyle: data.headerStyle,
    brandAccentPreset: data.brandAccentPreset,
    hlsUrl: data.hlsUrl,
    videoBackgroundUrl: data.videoBackgroundUrl,
    slideshowImages: data.slideshowImages,
    nowPlayingOverlayStyle: data.nowPlayingOverlayStyle,
    nowPlayingOverlaySettingsJson: data.nowPlayingOverlaySettingsJson,
    playerOverlayMode: data.playerOverlayMode,
    playerOverlayText: data.playerOverlayText,
    playerOverlayAlign: data.playerOverlayAlign,
    usePlayerGradient: data.usePlayerGradient,
    playerColorSchemeJson: data.playerColorSchemeJson,
    useBackgroundGradient: data.useBackgroundGradient,
    backgroundColorSchemeJson: data.backgroundColorSchemeJson,
    backgroundVisualPreset: data.backgroundVisualPreset,
  };
}

/** Channel look, disco widgets, feed/news and live shows for an artist page.
 * Block visibility comes from the channel first, so visitors see the
 * artist's choice. */
export function useArtistChannelLook(
  slug: string | undefined,
  username: string,
  isOwner = false,
) {
  const [channelVisual, setChannelVisual] =
    useState<ArtistChannelVisual | null>(null);
  const [channelVisualLoaded, setChannelVisualLoaded] = useState(!slug);
  const [lookExtras, setLookExtras] = useState<ChannelLookExtras>({});
  const [discoWidgets, setDiscoWidgets] = useState<DiscoWidgetRenderItem[]>([]);
  const [channelPosts, setChannelPosts] = useState<ArtistPost[]>([]);
  const [channelNews, setChannelNews] = useState<PinnedAnnouncement[]>([]);
  const [liveShows, setLiveShows] = useState<PublicRadioShow | null>(null);
  const [lookVisibility, setLookVisibility] = useState<
    Record<ArtistLookBlockId, boolean>
  >(() => loadArtistLookVisibility(username));
  const isOwnerRef = useRef(isOwner);
  isOwnerRef.current = isOwner;

  const applyChannel = useCallback(
    (channelSlug: string, data: PublicChannel) => {
      setChannelVisual(pickChannelVisual(data));
      setLookExtras(
        resolveChannelLookExtras(
          channelSlug,
          channelLookExtrasFromVisual(data),
        ),
      );
      setLookVisibility(
        resolveArtistLookVisibility(
          channelSlug,
          data.artistBlockVisibilityJson,
        ),
      );
      if (isOwnerRef.current) {
        uploadLocalArtistLookVisibilityOnce(
          channelSlug,
          data.artistBlockVisibilityJson,
        );
      }
    },
    [],
  );

  useEffect(() => {
    setChannelVisual(null);
    setChannelVisualLoaded(false);
    setDiscoWidgets([]);
    setChannelPosts([]);
    setChannelNews([]);
    if (!slug) {
      setChannelVisualLoaded(true);
      setLookExtras({});
      setLookVisibility(loadArtistLookVisibility(username));
      return;
    }
    setLookVisibility(loadArtistLookVisibility(slug));
    setLookExtras(resolveChannelLookExtras(slug, {}));
    let cancelled = false;
    // Each block loads on its own so one failing endpoint (e.g. posts) does
    // not blank the whole look.
    void fetchChannel(slug)
      .then((res) => {
        if (cancelled || !res.data) {
          return;
        }
        applyChannel(slug, res.data);
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setChannelVisualLoaded(true));
    void fetchChannelDiscoWidgets(slug)
      .then((r) => !cancelled && setDiscoWidgets(r.data))
      .catch(() => undefined);
    void fetchChannelPosts(slug)
      .then((r) => !cancelled && setChannelPosts(r.data))
      .catch(() => undefined);
    void fetchPinnedAnnouncements(slug)
      .then((news) => !cancelled && setChannelNews(news))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug, username, applyChannel]);

  useEffect(() => {
    setLiveShows(null);
    if (!slug) {
      return;
    }
    let cancelled = false;
    void fetchPublicRadioShow(slug)
      .then((result) => !cancelled && setLiveShows(result.data))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  /** Re-read the look after the designer saved. */
  const reloadLook = useCallback(() => {
    if (!slug) {
      return;
    }
    void fetchChannel(slug)
      .then((res) => {
        if (res.data) {
          applyChannel(slug, res.data);
        }
      })
      .catch(() => undefined);
  }, [slug, applyChannel]);

  return {
    channelVisual,
    channelVisualLoaded,
    lookExtras,
    discoWidgets,
    channelPosts,
    channelNews,
    liveShows,
    lookVisibility,
    setLookVisibility,
    reloadLook,
  };
}
