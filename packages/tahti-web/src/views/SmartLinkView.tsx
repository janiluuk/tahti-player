import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, MusicIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, useState, type FC } from 'react';

import {
  Button,
  ButtonAnchor,
  ButtonLink,
  ExternalLink,
} from '@tahti-player/ui';

import { fetchSmartLink } from '../api/client';
import { recordSmartLinkClick } from '../api/smart-link-clicks';
import type { SmartLinkView as SmartLinkData } from '../api/types';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageEmpty, PageLoading } from '../components/PageStates';
import { PlayableTrackTable } from '../components/PlayableTrackTable';
import { ReleaseTrackDownloads } from '../components/ReleaseTrackDownloads';
import { ReportButton } from '../components/ReportButton';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { dspServiceLabel } from '../lib/dspServices';
import { syncDocumentMetadata } from '../lib/seo';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import {
  SmartLinkLockedTracks,
  SmartLinkReleaseCredits,
} from './smart-link/SmartLinkReleaseDetails';
import { smartLinkPlayables } from './smart-link/smartLinkTracks';

type SmartLinkViewProps = { slug: string };

export const SmartLinkView: FC<SmartLinkViewProps> = ({ slug }) => {
  const [data, setData] = useState<SmartLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayerStore((state) => state.play);
  const me = useAuthStore((state) => state.user);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSmartLink(slug)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setData(result.data);
        const { release, artist } = result.data;
        syncDocumentMetadata(window.location.pathname, {
          title: `${release.title} by ${artist.displayName} on Tahti`,
          description:
            release.description ??
            `Listen to ${release.title} and find its official links on Tahti.`,
          image: release.artworkUrl ?? artist.avatarUrl ?? undefined,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const playables = useMemo(
    () => (data ? smartLinkPlayables(data) : []),
    [data],
  );

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

  const isOwner = Boolean(me && me.username === data.artist.username);
  const targets = Object.entries(data.targets).filter(([, url]) => url?.trim());
  const releaseYear = data.release.releaseDate
    ? new Date(data.release.releaseDate).getFullYear()
    : null;
  const metadata = [releaseYear, data.release.genre, data.release.type]
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
          <>
            <EmbedButton target={{ kind: 'release', id: data.release.id }} />
            {isOwner ? null : (
              <ReportButton
                targetType="RELEASE"
                targetId={data.release.id}
                label={data.release.title}
              />
            )}
          </>
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

      <SmartLinkLockedTracks data={data} />

      <ReleaseTrackDownloads
        smartLinkSlug={slug}
        tracks={data.release.tracks ?? []}
      />

      <section className="flex flex-col gap-2" aria-label="Listen on">
        <Eyebrow>Listen on</Eyebrow>
        {targets.length === 0 ? (
          <ButtonAnchor
            href={data.releaseUrl}
            variant="text"
            size="flexible"
            className="border-border hover:bg-background-secondary flex items-center justify-between rounded-lg border px-4 py-3 font-semibold transition-colors active:scale-100"
          >
            Tahti
            <ExternalLinkIcon size={16} aria-hidden />
          </ButtonAnchor>
        ) : (
          targets.map(([name, url]) => (
            <ExternalLink
              key={name}
              href={url}
              onClick={() =>
                recordSmartLinkClick(data.release.smartLinkSlug ?? slug, name)
              }
              className="border-border hover:bg-background-secondary flex items-center justify-between rounded-lg border px-4 py-3 font-semibold no-underline transition-colors"
            >
              <span>{dspServiceLabel(name)}</span>
              <span className="text-foreground-secondary flex items-center gap-2 text-xs font-normal">
                Listen
                <ExternalLinkIcon size={15} aria-hidden />
              </span>
            </ExternalLink>
          ))
        )}
      </section>

      <SmartLinkReleaseCredits data={data} />

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

      {data.release.showPoweredByFooter === true ? (
        <footer className="text-foreground-secondary pt-4 text-center text-xs">
          <ButtonLink
            to="/"
            variant="text"
            size="xs"
            className="text-foreground-secondary hover:text-foreground text-xs"
          >
            Powered by Tahti
          </ButtonLink>
        </footer>
      ) : null}
    </div>
  );
};
