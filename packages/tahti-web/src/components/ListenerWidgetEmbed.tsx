import { XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Box,
  Button,
  InlineError,
  InlineLoader,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchSpotifyArtistTracks,
  fetchSpotifyPlaylistTracks,
  spotifyCoverUrl,
  type SpotifyTrack,
} from '../api/sources';
import type { TahtiPlayable } from '../api/types';
import {
  listenerWidgetType,
  parseSpotifyListenLink,
} from '../content/listenerWidgets';
import { playableFromEmbed } from '../lib/embedPlayback';
import type { ListenerWidgetInstance } from '../stores/listenerWidgetsStore';
import { PlayableAmbientTrackList } from './PlayableAmbientTrackList';

function spotifyTracksToPlayables(tracks: SpotifyTrack[]): TahtiPlayable[] {
  return tracks.map((track) =>
    playableFromEmbed('spotify', {
      playerId: track.uri,
      title: track.title,
      artist: track.artists.join(', ') || 'Spotify',
      coverUrl: track.coverUrl ? spotifyCoverUrl(track.coverUrl) : undefined,
      embedUri: track.uri,
      durationSec: track.durationSec,
    }),
  );
}

function SpotifyWidgetTracks({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  onRemove?: () => void;
}) {
  const { t } = useTranslation('web');
  const type = listenerWidgetType(instance.typeId);
  const embedUrl = type?.toEmbedUrl(instance.input);
  const isArtist = parseSpotifyListenLink(instance.input)?.kind === 'artist';
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  );
  const [items, setItems] = useState<TahtiPlayable[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setLoadError(null);
    const fetchTracks = isArtist
      ? fetchSpotifyArtistTracks
      : fetchSpotifyPlaylistTracks;
    void fetchTracks(instance.input).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setItems([]);
        setLoadError(result.error);
        setStatus('fallback');
        return;
      }
      if (result.data.length === 0) {
        setItems([]);
        setLoadError(
          isArtist
            ? t('listenerWidgetEmbedText.artistNoPlayable')
            : t('listenerWidgetEmbedText.playlistNoPlayable'),
        );
        setStatus('fallback');
        return;
      }
      setItems(spotifyTracksToPlayables(result.data));
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [instance.input, isArtist, t]);

  return (
    <Box
      variant="tertiary"
      className="group relative h-auto w-auto flex-col gap-2 rounded-lg p-3"
      data-testid="listener-widget-embed"
      data-widget-type={instance.typeId}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">
          {instance.label}
        </span>
        {onRemove ? (
          <Tooltip
            content={t('listenerWidgetEmbedLabels.removeLabel', {
              label: instance.label,
            })}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={t('listenerWidgetEmbedLabels.removeLabel', {
                label: instance.label,
              })}
              onClick={onRemove}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <XIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
      </div>
      {status === 'loading' ? (
        <InlineLoader
          label={
            isArtist
              ? t('listenerWidgetEmbedText.loadingArtist')
              : t('listenerWidgetEmbed.loadingPlaylist')
          }
          className="py-6"
        />
      ) : null}
      {status === 'ready' ? (
        <PlayableAmbientTrackList
          items={items}
          emptyMessage={
            isArtist
              ? t('listenerWidgetEmbedText.artistNoTracks')
              : t('listenerWidgetEmbed.thisPlaylistHasNoTracks')
          }
          compactActions
        />
      ) : null}
      {status === 'fallback' ? (
        <div className="flex flex-col gap-2">
          {loadError ? (
            <p className="text-foreground-secondary text-xs" role="status">
              {t('listenerWidgetEmbedText.showingEmbed', {
                error: loadError,
              })}
            </p>
          ) : null}
          {embedUrl && type ? (
            <iframe
              title={instance.label}
              src={embedUrl}
              width="100%"
              height={type.embedHeight}
              style={{ border: 0 }}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          ) : (
            <InlineError textSize="xs">
              {t('listenerWidgetEmbedText.couldNotLoad')}
            </InlineError>
          )}
        </div>
      ) : null}
    </Box>
  );
}

/** Renders one enabled external widget instance. Spotify playlists and
 * artists resolve to a normal track table (embed playback in the player bar);
 * other platforms use their official iframe embeds. */
export function ListenerWidgetEmbed({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  /** Called when the hover X is clicked — the caller owns confirmation,
   * this component doesn't remove anything itself. */
  onRemove?: () => void;
}) {
  const { t } = useTranslation('web');
  if (instance.typeId === 'spotify') {
    return <SpotifyWidgetTracks instance={instance} onRemove={onRemove} />;
  }

  const type = listenerWidgetType(instance.typeId);
  const embedUrl = type?.toEmbedUrl(instance.input);

  return (
    <Box
      variant="tertiary"
      className="group relative h-auto w-auto flex-col gap-2 rounded-lg p-3"
      data-testid="listener-widget-embed"
      data-widget-type={instance.typeId}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium">
          {instance.label}
        </span>
        {onRemove ? (
          <Tooltip
            content={t('listenerWidgetEmbedLabels.removeLabel', {
              label: instance.label,
            })}
            side="top"
          >
            <Button
              size="icon-sm"
              variant="text"
              aria-label={t('listenerWidgetEmbedLabels.removeLabel', {
                label: instance.label,
              })}
              onClick={onRemove}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <XIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
      </div>
      {embedUrl && type ? (
        <iframe
          title={instance.label}
          src={embedUrl}
          width="100%"
          height={type.embedHeight}
          style={{ border: 0 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <p className="text-foreground-secondary text-xs" role="alert">
          {type
            ? t('listenerWidgetEmbedText.unrecognizedService', {
                service: type.name,
              })
            : t('listenerWidgetEmbedText.unrecognized')}
        </p>
      )}
    </Box>
  );
}
