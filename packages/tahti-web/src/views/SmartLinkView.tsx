import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, MusicIcon, PlayIcon } from 'lucide-react';
import { useEffect, useMemo, type FC } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonAnchor,
  ButtonLink,
  ClampedText,
  EditIconLink,
  ExternalLink,
} from '@tahti-player/ui';

import { fetchSmartLink } from '../api/client';
import { recordSmartLinkClick } from '../api/smart-link-clicks';
import type { SmartLinkView as SmartLinkData } from '../api/types';
import { CollectionTrackList } from '../components/CollectionTrackList';
import { EmbedButton } from '../components/EmbedButton';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { ReleaseTrackDownloads } from '../components/ReleaseTrackDownloads';
import { ReleaseTrackStemsList } from '../components/ReleaseTrackStemsList';
import { ReportButton } from '../components/ReportButton';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { hasAccountRole } from '../lib/accountRoles';
import { resolveArtworkVisualizerPreset } from '../lib/artworkVisualizer';
import { dspServiceLabel } from '../lib/dspServices';
import { releaseTypeLabel } from '../lib/releaseLabels';
import { syncDocumentMetadata } from '../lib/seo';
import { useSnapshotFetch } from '../lib/useSnapshotFetch';
import { useAuthStore } from '../stores/authStore';
import { usePlayerStore } from '../stores/playerStore';
import {
  SmartLinkLockedTracks,
  SmartLinkReleaseCredits,
} from './smart-link/SmartLinkReleaseDetails';
import {
  smartLinkLockedTracks,
  smartLinkPlayables,
  smartLinkTrackMeta,
} from './smart-link/smartLinkTracks';

type SmartLinkViewProps = { slug: string };

export const SmartLinkView: FC<SmartLinkViewProps> = ({ slug }) => {
  const { t } = useTranslation('web');
  const {
    data,
    loading,
    error: loadError,
    retry,
  } = useSnapshotFetch<SmartLinkData>(`smart-link:${slug}`, async () => {
    const result = await fetchSmartLink(slug);
    return result.data;
  });
  const play = usePlayerStore((state) => state.play);
  const me = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!data) {
      return;
    }
    const { release, artist } = data;
    syncDocumentMetadata(window.location.pathname, {
      title: t('smartLink.docTitle', {
        title: release.title,
        artist: artist.displayName,
      }),
      description:
        release.description ??
        t('smartLink.docDescription', { title: release.title }),
      image: release.artworkUrl ?? artist.avatarUrl ?? undefined,
    });
  }, [data, t]);

  const playables = useMemo(
    () => (data ? smartLinkPlayables(data) : []),
    [data],
  );
  const trackMeta = useMemo(
    () => (data ? smartLinkTrackMeta(data) : undefined),
    [data],
  );

  if (loading) {
    return <PageLoading label={t('smartLink.loading')} />;
  }

  if (loadError) {
    return (
      <PageError
        title={t('smartLink.loadError')}
        description={loadError}
        onRetry={retry}
      />
    );
  }

  if (!data) {
    return (
      <PageEmpty
        headingLevel={1}
        title={t('smartLink.notFoundTitle')}
        description={t('smartLink.notFoundDescription')}
      />
    );
  }

  const isOwner = Boolean(me && me.username === data.artist.username);
  const canEdit = isOwner || hasAccountRole(me, 'BOARD');
  const targets = Object.entries(data.targets).filter(([, url]) => url?.trim());
  const releaseYear = data.release.releaseDate
    ? new Date(data.release.releaseDate).getFullYear()
    : null;
  const metadata = [
    releaseYear,
    data.release.genre,
    data.release.type ? releaseTypeLabel(data.release.type, t) : null,
  ]
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
            label: t('smartLink.tracks'),
            value: playables.length,
            icon: MusicIcon,
          },
        ]
      : [];

  return (
    <div className="relative isolate mx-auto flex w-full max-w-xl flex-col gap-6 pb-10">
      <PageBackLink
        to="/u/$username"
        params={{ username: data.artist.username }}
        label={data.artist.displayName || data.artist.username}
      />

      <EntitySocialHeader
        title={data.release.title}
        imageUrl={data.release.artworkUrl}
        imageAlt={`${data.release.title} cover`}
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
              <ClampedText
                lines={3}
                wrapperClassName="mt-1"
                className="whitespace-pre-wrap"
              >
                {data.release.description}
              </ClampedText>
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
            {canEdit ? (
              <EditIconLink
                to="/studio/releases/$id"
                params={{ id: data.release.id }}
                search={{ edit: true }}
                label={t('actions.editInStudio')}
                className="bg-background border-border rounded-md border-(length:--border-width)"
              />
            ) : null}
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
            {t('smartLinkView.playAll')}
          </Button>
        ) : null}
      </EntitySocialHeader>

      <CollectionTrackList
        items={playables}
        getTrackMeta={trackMeta}
        title={t('smartLink.tracks')}
        empty={
          smartLinkLockedTracks(data).length === 0
            ? {
                title: t('smartLink.noPlayableTitle'),
                description: t('smartLink.noPlayableDescription'),
              }
            : null
        }
      />

      {(data.release.tracks ?? []).some(
        (track) => Array.isArray(track.stems) && track.stems.length > 0,
      ) ? (
        <section
          className="flex flex-col gap-3"
          aria-label={t('releaseTrackStems.heading')}
        >
          <Eyebrow>{t('releaseTrackStems.heading')}</Eyebrow>
          <ul className="flex flex-col gap-3">
            {(data.release.tracks ?? []).map((track) =>
              track.stems && track.stems.length > 0 ? (
                <li key={track.id ?? `${track.position}-${track.title}`}>
                  <p className="mb-1 text-sm font-medium">{track.title}</p>
                  <ReleaseTrackStemsList
                    stems={track.stems}
                    trackTitle={track.title}
                    artist={data.artist.displayName}
                    coverUrl={data.release.artworkUrl}
                  />
                </li>
              ) : null,
            )}
          </ul>
        </section>
      ) : null}

      <SmartLinkLockedTracks data={data} />

      <ReleaseTrackDownloads
        smartLinkSlug={slug}
        tracks={data.release.tracks ?? []}
      />

      <section
        className="flex flex-col gap-2"
        aria-label={t('smartLink.listenOn')}
      >
        <Eyebrow>{t('smartLinkView.listenOn')}</Eyebrow>
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
                {t('smartLinkView.listen')}
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
            {t('smartLinkView.poweredByTahti')}
          </ButtonLink>
        </footer>
      ) : null}
    </div>
  );
};
