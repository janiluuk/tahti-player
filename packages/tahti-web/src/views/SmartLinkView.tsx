import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, MusicIcon, PlayIcon } from 'lucide-react';
import { useEffect, useState, type FC } from 'react';

import { Button } from '@tahti-player/ui';

import { fetchChannelSound, fetchProfile, fetchSmartLink } from '../api/client';
import type {
  SmartLinkView as SmartLinkData,
  TahtiPlayable,
} from '../api/types';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { syncDocumentMetadata } from '../lib/seo';
import { usePlayerStore } from '../stores/playerStore';

const DSP_LABELS: Record<string, string> = {
  apple: 'Apple Music',
  amazon: 'Amazon Music',
  bandcamp: 'Bandcamp',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  tahti: 'Tahti',
  tidal: 'Tidal',
  youtube: 'YouTube Music',
};

type SmartLinkViewProps = { slug: string };

export const SmartLinkView: FC<SmartLinkViewProps> = ({ slug }) => {
  const [data, setData] = useState<SmartLinkData | null>(null);
  const [playables, setPlayables] = useState<TahtiPlayable[]>([]);
  const [genre, setGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((state) => state.play);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchSmartLink(slug).then(async (result) => {
      if (cancelled) {
        return;
      }
      setData(result.data);
      setGenre(result.data.release.genre ?? null);

      const { release, artist } = result.data;
      syncDocumentMetadata(window.location.pathname, {
        title: `${release.title} by ${artist.displayName} on Tahti`,
        description:
          release.description ??
          `Listen to ${release.title} and find its official links on Tahti.`,
        image: release.artworkUrl ?? artist.avatarUrl ?? undefined,
      });

      try {
        const profile = await fetchProfile(result.data.artist.username);
        const matched = profile.data.releases.find(
          (release) =>
            release.smartLinkSlug === slug ||
            release.id === result.data.release.id,
        );
        const fromRelease =
          matched?.tracks
            ?.filter((track) => track.playUrl)
            .map(
              (track): TahtiPlayable => ({
                id: `sound:${track.soundId ?? `${matched.id}-${track.position}`}`,
                kind: 'sound',
                title: track.title,
                artist: result.data.artist.displayName,
                coverUrl: matched.artworkUrl ?? undefined,
                streamUrl: track.playUrl!,
                protocol: track.playUrl!.includes('.m3u8') ? 'hls' : 'https',
                channelSlug: profile.data.channel?.slug,
              }),
            ) ?? [];
        let soundGenre = matched?.genre ?? null;
        if (!soundGenre && profile.data.channel?.slug && matched?.tracks) {
          const sound = await fetchChannelSound(profile.data.channel.slug);
          const soundIds = new Set(
            matched.tracks
              .map((track) => track.soundId)
              .filter((id): id is string => Boolean(id)),
          );
          soundGenre =
            sound.data.find((item) => soundIds.has(item.id))?.genre ?? null;
        }
        if (!cancelled) {
          setPlayables(fromRelease);
          setGenre(result.data.release.genre ?? soundGenre);
        }
      } catch {
        if (!cancelled) {
          setPlayables([]);
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return <PageLoading label="Loading release…" />;
  }

  if (!data) {
    return (
      <PageEmpty
        title="Release not found"
        description="This release may have been removed or is not available."
      />
    );
  }

  const targets = Object.entries(data.targets).filter(([, url]) => url?.trim());
  const releaseYear = data.release.releaseDate
    ? new Date(data.release.releaseDate).getFullYear()
    : null;
  const metadata = [releaseYear, genre, data.release.type]
    .filter(Boolean)
    .join(' · ');
  const backdropUrl =
    data.release.galleryMode === 'STATIC_SLIDESHOW'
      ? (data.release.slideshowImages?.[0] ?? null)
      : null;
  const artworkVisualizer =
    data.release.visualPreset && data.release.visualPreset !== 'MINIMAL'
      ? data.release.visualPreset
      : resolveArtworkVisualizerPreset(data.release.id);
  const headerStats: EntitySocialStat[] =
    playables.length > 0
      ? [
          {
            key: 'tracks',
            label: 'Tracks',
            value: playables.length,
            icon: MusicIcon,
          },
        ]
      : [];

  return (
    <div className="relative isolate mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <Link
        to="/u/$username"
        params={{ username: data.artist.username }}
        className="text-foreground-secondary text-xs hover:underline"
      >
        ← {data.artist.username}
      </Link>

      <EntitySocialHeader
        title={data.release.title}
        imageUrl={data.release.artworkUrl}
        subtitle={
          <Link
            to="/u/$username"
            params={{ username: data.artist.username }}
            className="hover:text-foreground font-semibold underline-offset-2 hover:underline"
          >
            {data.artist.displayName}
          </Link>
        }
        description={
          <>
            {metadata ? <p className="capitalize">{metadata}</p> : null}
            {data.release.description ? (
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap">
                {data.release.description}
              </p>
            ) : null}
          </>
        }
        backdropUrl={backdropUrl}
        visualizerPreset={artworkVisualizer}
        artworkUrlForVisualizer={
          data.release.artworkUrl ?? data.artist.avatarUrl
        }
        stats={headerStats}
        actions={
          <EmbedButton target={{ kind: 'release', id: data.release.id }} />
        }
        data-testid="release-social-header"
      >
        {playables.length > 0 ? (
          <Button
            size="sm"
            variant="secondary"
            className="bg-background border-border rounded-md border-(length:--border-width)"
            onClick={() => {
              const [head, ...rest] = playables;
              if (head) {
                play(head, { enqueueRest: rest });
              }
            }}
          >
            <PlayIcon size={15} aria-hidden className="mr-1.5" />
            Play all
          </Button>
        ) : null}
      </EntitySocialHeader>

      {playables.length > 0 ? (
        <section className="flex flex-col gap-3">
          <Eyebrow>Tracks</Eyebrow>
          <PlayableTrackTable items={playables} />
        </section>
      ) : null}

      <section className="flex flex-col gap-2" aria-label="Listen on">
        <Eyebrow>Listen on</Eyebrow>
        {targets.length === 0 ? (
          <a
            href={data.releaseUrl}
            className="border-border hover:bg-background-secondary flex items-center justify-between rounded-lg border px-4 py-3 font-semibold transition-colors"
          >
            Tahti
            <ExternalLinkIcon size={16} aria-hidden />
          </a>
        ) : (
          targets.map(([name, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="border-border hover:bg-background-secondary flex items-center justify-between rounded-lg border px-4 py-3 font-semibold transition-colors"
            >
              <span>{DSP_LABELS[name.toLowerCase()] ?? name}</span>
              <span className="text-foreground-secondary flex items-center gap-2 text-xs font-normal">
                Listen
                <ExternalLinkIcon size={15} aria-hidden />
              </span>
            </a>
          ))
        )}
      </section>

      {data.featuredCollections.length > 0 ? (
        <section className="flex flex-col gap-2">
          <Eyebrow>More from {data.artist.displayName}</Eyebrow>
          {data.featuredCollections.map((collection) => (
            <Link
              key={collection.slug}
              to="/u/$username/c/$slug"
              params={{
                username: data.artist.username,
                slug: collection.slug,
              }}
              className="border-border hover:bg-background-secondary flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors"
            >
              <strong>{collection.name}</strong>
              <span className="text-foreground-secondary">
                {collection.itemCount ?? 0} items
              </span>
            </Link>
          ))}
        </section>
      ) : null}
    </div>
  );
};
