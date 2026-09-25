import { Link } from '@tanstack/react-router';
import {
  HeartIcon,
  ListMusicIcon,
  MessageCircle,
  PlayIcon,
  Repeat2Icon,
} from 'lucide-react';

import { Button, CardGrid, Tooltip } from '@tahti-player/ui';

import type {
  PublicProfile,
  PublicProfileTrack,
  TahtiPlayable,
} from '../../api/types';
import {
  parseNowPlayingOverlaySettings,
  resolveNowPlayingOverlayPreset,
} from '../../content/nowPlayingOverlayPresets';
import type { ArtistLookBlockId } from '../../lib/channelLookElements';
import {
  colorSchemeCssVars,
  type NormalizedColorScheme,
} from '../../lib/colorScheme';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { ChannelTextOverlayView } from '../ChannelTextOverlayView';
import { ChannelVisualizer } from '../ChannelVisualizer';
import { GlowMediaTile } from '../GlowMediaTile';
import { NowPlayingOverlay } from '../NowPlayingOverlay';
import { Eyebrow } from '../tahti/Eyebrow';

const GLOW_COLORS = [
  'var(--color-accent-purple)',
  'var(--color-accent-cyan)',
  'var(--color-accent-red)',
  'var(--color-accent-green)',
  'var(--color-accent-yellow)',
  'var(--color-accent-blue)',
];

type Props = {
  channel: PublicProfile['channel'];
  visualSettingsJson?: string | null;
  artist: PublicProfile['artist'];
  isOwner: boolean;
  isAdministrator: boolean;
  visibility: Record<ArtistLookBlockId, boolean>;
  scheme: NormalizedColorScheme;
  borderMuted: string;
  stageGradient: string;
  bottomGradient: string;
  visualizerPreset?: string;
  overlay: {
    show: boolean;
    mode: string | null;
    text: string | null;
    align: string | null;
    styleId: string | null;
    settingsJson: string | null;
  };
  nowPlayingHere: TahtiPlayable | null;
  featured: {
    playable: TahtiPlayable | null;
    isPlaying: boolean;
    track: PublicProfileTrack | undefined;
    onPlay: () => void;
  };
  pinnedTiles: Array<{ track: PublicProfileTrack; playable: TahtiPlayable }>;
  onPlay: (playable: TahtiPlayable) => void;
  onToggleFavorite: (playable: TahtiPlayable) => void;
  favoriteTracks: TahtiPlayable[];
  onOpenManager: () => void;
};

/** ArtistView's "Stage" tab body: channel player stage, engagement and pinned tiles. */
export function ArtistMusicTab({
  channel,
  visualSettingsJson,
  artist,
  isOwner,
  isAdministrator,
  visibility,
  scheme,
  borderMuted,
  stageGradient,
  bottomGradient,
  visualizerPreset,
  overlay,
  nowPlayingHere,
  featured,
  pinnedTiles,
  onPlay,
  onToggleFavorite,
  favoriteTracks,
  onOpenManager,
}: Props) {
  return (
    <section className="flex flex-col gap-8">
      {visibility.player ? (
        <div
          className="relative min-h-[20rem] w-full overflow-hidden rounded-lg border sm:min-h-[28rem]"
          style={{
            borderColor: `${borderMuted}66`,
            backgroundColor: scheme.bg,
            ...colorSchemeCssVars(scheme),
          }}
        >
          {visualizerPreset ? (
            <ChannelVisualizer
              className="absolute inset-0 size-full opacity-60"
              artworkUrl={
                nowPlayingHere?.coverUrl ?? artist.avatarUrl ?? undefined
              }
              colorScheme={scheme}
              visualSettingsJson={visualSettingsJson}
              preset={visualizerPreset}
            />
          ) : nowPlayingHere?.coverUrl ? (
            <img
              src={nowPlayingHere.coverUrl}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-35"
            />
          ) : null}
          <div
            className="absolute inset-0"
            style={{ background: stageGradient }}
            aria-hidden
          />
          {overlay.show ? (
            <div className="absolute inset-x-0 top-10 z-[2] px-4 sm:top-12">
              <ChannelTextOverlayView
                mode={overlay.mode}
                text={overlay.text}
                align={overlay.align}
                accent={scheme.accent}
                highlight={scheme.highlight}
                size="sm"
              />
            </div>
          ) : null}

          {channel && (isOwner || isAdministrator) ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="absolute top-3 right-3 z-[2]"
              onClick={onOpenManager}
              aria-label="Manage stream playlist"
              title="Manage stream playlist"
            >
              <ListMusicIcon size={16} aria-hidden />
              <span>Manage</span>
            </Button>
          ) : null}

          {featured.playable ? (
            <div className="absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
              <Tooltip
                content={
                  featured.isPlaying
                    ? 'Pause featured track'
                    : 'Play featured track'
                }
                side="top"
              >
                <Button
                  type="button"
                  size="icon"
                  className="bg-primary text-primary-foreground size-16 rounded-full shadow-xl sm:size-20"
                  onClick={featured.onPlay}
                  aria-label={
                    featured.isPlaying
                      ? 'Pause featured track'
                      : 'Play featured track'
                  }
                  aria-pressed={featured.isPlaying}
                >
                  {featured.isPlaying ? (
                    <span className="text-xl font-bold" aria-hidden>
                      ||
                    </span>
                  ) : (
                    <PlayIcon size={28} className="fill-current" aria-hidden />
                  )}
                </Button>
              </Tooltip>
            </div>
          ) : null}

          <div
            className="absolute inset-x-0 bottom-0 z-[1] flex items-end gap-3 p-3 sm:gap-4 sm:p-4"
            style={{ background: bottomGradient }}
          >
            {nowPlayingHere ? (
              <NowPlayingOverlay
                presetId={resolveNowPlayingOverlayPreset(overlay.styleId)}
                title={nowPlayingHere.title}
                artist={artist.displayName}
                artworkUrl={nowPlayingHere.coverUrl}
                settings={parseNowPlayingOverlaySettings(overlay.settingsJson)}
              />
            ) : (
              <div
                className="truncate text-base leading-tight font-bold sm:text-lg"
                style={{ color: scheme.text }}
              >
                {artist.displayName}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {visibility.player && featured.playable ? (
        <div
          className="flex items-center justify-center gap-5"
          aria-label="Track engagement"
        >
          <Button
            type="button"
            variant="text"
            size="xs"
            className="text-foreground-secondary hover:text-foreground gap-1.5 px-1.5 text-sm"
            aria-label={`Like ${featured.playable.title}`}
          >
            <HeartIcon size={18} aria-hidden />
            <span className="tabular-nums">
              {featured.track?.likeCount ?? 0}
            </span>
          </Button>
          <Link
            to="/t/$id"
            params={{ id: featured.playable.id.replace(/^sound:/, '') }}
            className="text-foreground-secondary hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
            aria-label={`Comments on ${featured.playable.title}`}
          >
            <MessageCircle size={18} aria-hidden />
            <span className="tabular-nums">
              {featured.track?.commentCount ?? 0}
            </span>
          </Link>
          <Button
            type="button"
            variant="text"
            size="xs"
            className="text-foreground-secondary hover:text-foreground gap-1.5 px-1.5 text-sm"
            aria-label={`Repost ${featured.playable.title}`}
          >
            <Repeat2Icon size={18} aria-hidden />
            <span className="tabular-nums">
              {featured.track?.repostCount ?? 0}
            </span>
          </Button>
        </div>
      ) : null}

      {pinnedTiles.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>Pinned</Eyebrow>
            {isOwner && (
              <Link
                to="/studio/sounds"
                className="text-foreground-secondary text-xs underline-offset-2 hover:underline"
              >
                Manage pins in Studio
              </Link>
            )}
          </div>
          <CardGrid className="grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-6">
            {pinnedTiles.map(({ track, playable }, i) => (
              <GlowMediaTile
                key={track.id}
                title={track.title}
                subtitle={track.artistName ?? artist.displayName}
                src={track.bannerUrl ?? placeholderArtworkUrl(track.id)}
                glowColor={GLOW_COLORS[i % GLOW_COLORS.length]}
                onPlay={() => onPlay(playable)}
                onFavorite={() => onToggleFavorite(playable)}
                favorited={favoriteTracks.some((t) => t.id === playable.id)}
              />
            ))}
          </CardGrid>
        </div>
      )}
    </section>
  );
}
