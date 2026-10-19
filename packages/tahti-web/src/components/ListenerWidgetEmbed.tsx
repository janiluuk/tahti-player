import { XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Box, Button, Loader, Tooltip } from '@tahti-player/ui';

import {
  fetchSpotifyPlaylistTracks,
  spotifyCoverUrl,
  type SpotifyTrack,
} from '../api/sources';
import type { TahtiPlayable } from '../api/types';
import { listenerWidgetType } from '../content/listenerWidgets';
import { playableFromEmbed } from '../lib/embedPlayback';
import type { ListenerWidgetInstance } from '../stores/listenerWidgetsStore';
import { PlayableTrackTable } from './PlayableTrackTable';

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

function SpotifyPlaylistTracks({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  onRemove?: () => void;
}) {
  const type = listenerWidgetType(instance.typeId);
  const embedUrl = type?.toEmbedUrl(instance.input);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  );
  const [items, setItems] = useState<TahtiPlayable[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetchSpotifyPlaylistTracks(instance.input).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok || result.data.length === 0) {
        setItems([]);
        setStatus('fallback');
        return;
      }
      setItems(spotifyTracksToPlayables(result.data));
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [instance.input]);

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
          <Tooltip content={`Remove ${instance.label}`} side="top">
            <Button
              size="icon-sm"
              variant="text"
              aria-label={`Remove ${instance.label}`}
              onClick={onRemove}
              className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <XIcon size={14} aria-hidden />
            </Button>
          </Tooltip>
        ) : null}
      </div>
      {status === 'loading' ? (
        <div className="flex items-center gap-2 py-6 text-sm">
          <Loader size="sm" />
          <span className="text-foreground-secondary">Loading playlist…</span>
        </div>
      ) : null}
      {status === 'ready' ? (
        <PlayableTrackTable
          items={items}
          emptyMessage="This playlist has no tracks."
          filterable={false}
          quietHeader
          compactActions
        />
      ) : null}
      {status === 'fallback' ? (
        embedUrl && type ? (
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
            Couldn&apos;t load this Spotify playlist — remove it and try a
            public playlist link again.
          </p>
        )
      ) : null}
    </Box>
  );
}

/** Renders one enabled external widget instance. Spotify playlists resolve to
 * a normal track table (embed playback in the player bar); other platforms
 * use their official iframe embeds. */
export function ListenerWidgetEmbed({
  instance,
  onRemove,
}: {
  instance: ListenerWidgetInstance;
  /** Called when the hover X is clicked — the caller owns confirmation,
   * this component doesn't remove anything itself. */
  onRemove?: () => void;
}) {
  if (instance.typeId === 'spotify') {
    return <SpotifyPlaylistTracks instance={instance} onRemove={onRemove} />;
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
          <Tooltip content={`Remove ${instance.label}`} side="top">
            <Button
              size="icon-sm"
              variant="text"
              aria-label={`Remove ${instance.label}`}
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
          Couldn&apos;t recognize this URL — remove it and try pasting the
          {type ? ` ${type.name}` : ''} link again.
        </p>
      )}
    </Box>
  );
}
