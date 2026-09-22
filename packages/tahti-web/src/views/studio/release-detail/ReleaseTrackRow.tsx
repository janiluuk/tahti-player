import { Link } from '@tanstack/react-router';
import { PlayIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { fetchEditorSource, fetchStudioSound } from '../../../api/studio';
import type { StudioRelease, StudioSound } from '../../../api/studio-types';
import { EmbedTrackRow } from '../../../components/EmbedTrackRow';
import { SourceServiceIcon } from '../../../components/SourceServiceIcon';
import { usePlayerStore } from '../../../stores/playerStore';

/** Per-row play/editor/Bandcamp affordance used by the Smart Links tab's
 * own reorderable tracklist (untouched by the Overview TrackTable swap). */
export function ReleaseTrackRow({
  track,
  shopUrl,
  isPlaying = false,
  sound,
}: {
  track: NonNullable<StudioRelease['tracks']>[number];
  shopUrl?: string;
  isPlaying?: boolean;
  /** The already-loaded library sound, so the row needn't fetch it again. */
  sound?: StudioSound;
}) {
  const play = usePlayerStore((state) => state.play);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [embed, setEmbed] = useState<{
    provider: 'HEARTHIS' | 'MIXCLOUD' | 'SPOTIFY' | 'BANDCAMP';
    uri: string;
  } | null>(null);

  useEffect(() => {
    if (!track.soundId) {
      return;
    }
    const soundId = track.soundId;
    let cancelled = false;
    setEmbed(null);
    setSourceUrl(null);
    void (async () => {
      try {
        const loaded = sound ?? (await fetchStudioSound(soundId)).data;
        if (cancelled) {
          return;
        }
        if (loaded.embedProvider && loaded.embedUri) {
          setEmbed({
            provider: loaded.embedProvider,
            uri: loaded.embedUri,
          });
          return;
        }
        const source = await fetchEditorSource(soundId);
        if (!cancelled) {
          setSourceUrl(source.data.url);
        }
      } catch {
        // No preview for this row; the title and editor link still render.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [track.soundId, sound]);

  if (embed) {
    return (
      <EmbedTrackRow
        title={track.title}
        provider={embed.provider}
        embedUri={embed.uri}
        className={isPlaying ? 'border-primary bg-primary/10' : ''}
      />
    );
  }

  return (
    <li
      className={`flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 transition-colors ${isPlaying ? 'border-primary bg-primary/10 text-primary' : 'border-transparent'}`}
      aria-current={isPlaying ? 'true' : undefined}
    >
      <span className="min-w-0 flex-1 truncate">{track.title}</span>
      {sourceUrl ? (
        <Tooltip content={`Play ${track.title}`} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={`Play ${track.title}`}
            onClick={() =>
              play({
                id: `sound:${track.soundId}`,
                kind: 'sound',
                title: track.title,
                artist: 'You',
                streamUrl: sourceUrl,
                protocol: sourceUrl.includes('.m3u8') ? 'hls' : 'https',
              })
            }
          >
            <PlayIcon size={15} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      {track.soundId ? (
        <Link
          to="/studio/sounds/$id/editor"
          params={{ id: track.soundId }}
          className="text-primary text-xs underline"
        >
          editor
        </Link>
      ) : null}
      {shopUrl ? (
        <a
          href={shopUrl}
          target="_blank"
          rel="noreferrer"
          className="border-border inline-flex size-7 items-center justify-center overflow-hidden rounded border"
          aria-label={`Open ${track.title} on Bandcamp`}
          title="Open on Bandcamp"
        >
          <SourceServiceIcon id="bandcamp" size="detail" />
        </a>
      ) : null}
    </li>
  );
}
