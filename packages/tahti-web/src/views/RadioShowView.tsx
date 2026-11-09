import { Link } from '@tanstack/react-router';
import { CalendarIcon, MicIcon, RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  ButtonLink,
  ClampedText,
  MediaArtwork,
  SectionShell,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import {
  fetchPublicRadioShow,
  fetchRadioShowNowPlaying,
  fetchRadioShowUpcoming,
  type PublicRadioShow,
  type RadioShowNowPlayingTrack,
  type RadioShowUpcomingTrack,
} from '../api/shows';
import {
  EntitySocialHeader,
  type EntitySocialStat,
} from '../components/EntitySocialHeader';
import { PageBackLink } from '../components/PageBackLink';
import { PageFrame } from '../components/PageHeader';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { RadioShowEpisodeList } from '../components/RadioShowEpisodeList';
import { Eyebrow } from '../components/tahti/Eyebrow';
import { usePolling } from '../hooks/usePolling';
import { placeholderArtworkUrl } from '../lib/placeholderArt';
import { isGreenRoomWindow } from '../lib/radioSchedule';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';

const NOW_PLAYING_POLL_MS = 30_000;

function NowPlayingSection({
  track,
  upcoming,
  pollError,
  onRetry,
}: {
  track: RadioShowNowPlayingTrack | null;
  upcoming: RadioShowUpcomingTrack[];
  pollError: string | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation('web');
  if (!track && upcoming.length === 0 && !pollError) {
    return null;
  }

  return (
    <SectionShell title={t('radioShowView.nowPlaying')}>
      <div className="flex flex-col gap-3">
        {pollError ? (
          <PageErrorBanner
            title={
              track || upcoming.length > 0
                ? t('radioShowViewStates.couldNotRefreshNowPlaying')
                : t('radioShowViewStates.couldNotLoadNowPlaying')
            }
            description={pollError}
            onRetry={onRetry}
          />
        ) : null}
        {track ? (
          <div className="flex min-w-0 items-center gap-3">
            <MediaArtwork
              size="md"
              src={track.artworkUrl}
              alt=""
              className="bg-surface-secondary rounded-lg text-sm font-bold"
              placeholder="♪"
            />
            <div className="min-w-0">
              <Eyebrow tone="green">{t('radioShowView.onAir')}</Eyebrow>
              <div className="text-foreground truncate text-lg font-bold tracking-tight">
                {track.title}
              </div>
              <div className="text-foreground-secondary truncate text-sm">
                {track.artistName}
              </div>
            </div>
          </div>
        ) : null}
        {upcoming.length > 0 ? (
          <div>
            <div className="text-foreground-secondary mb-2 text-xs font-semibold uppercase">
              {t('radioShowView.upNext')}
            </div>
            <ul className="border-border divide-border divide-y overflow-hidden rounded-lg border">
              {upcoming.map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <MediaArtwork
                    size="sm"
                    src={item.artworkUrl}
                    alt=""
                    className="bg-surface-secondary rounded text-xs font-bold"
                    placeholder="♪"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {item.title}
                    </div>
                    <div className="text-foreground-secondary truncate text-xs">
                      {item.artistName}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

export const RadioShowView = ({ channelSlug }: { channelSlug: string }) => {
  const { t } = useTranslation('web');
  const {
    data: show,
    loading,
    error: loadError,
    retry,
  } = useSnapshotFetch<PublicRadioShow | null>(
    `radio-show:${channelSlug}`,
    async () => apiResult(await fetchPublicRadioShow(channelSlug)),
  );
  const [nowPlayingTrack, setNowPlayingTrack] =
    useState<RadioShowNowPlayingTrack | null>(null);
  const [upcomingTracks, setUpcomingTracks] = useState<
    RadioShowUpcomingTrack[]
  >([]);
  const [pollErrors, setPollErrors] = useState<{
    track: string | null;
    upcoming: string | null;
  }>({ track: null, upcoming: null });

  const reloadNowPlaying = () => {
    void fetchRadioShowNowPlaying(channelSlug).then((result) => {
      if (result.meta.source === 'api' && result.meta.reason) {
        setPollErrors((current) => ({
          ...current,
          track: result.meta.reason ?? null,
        }));
        return;
      }
      setPollErrors((current) => ({ ...current, track: null }));
      setNowPlayingTrack(result.data);
    });
    void fetchRadioShowUpcoming(channelSlug).then((result) => {
      if (result.meta.source === 'api' && result.meta.reason) {
        setPollErrors((current) => ({
          ...current,
          upcoming: result.meta.reason ?? null,
        }));
        return;
      }
      setPollErrors((current) => ({ ...current, upcoming: null }));
      setUpcomingTracks(result.data);
    });
  };

  useEffect(() => {
    reloadNowPlaying();
  }, [channelSlug]);

  usePolling(reloadNowPlaying, NOW_PLAYING_POLL_MS);

  if (loading) {
    return <PageLoading label={t('loading.loadingShow')} />;
  }

  if (!show && loadError) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadShow')}
        description={loadError}
        onRetry={retry}
      />
    );
  }

  if (!show) {
    return (
      <PageEmpty
        headingLevel={1}
        title={t('empties.showNotFound')}
        description={t('empties.thisTahtiRadioShowIsNot')}
      />
    );
  }

  // Only the nearest upcoming slot and the most recent past one can
  // plausibly be imminent/live/just-wrapped — no need to scan the whole list.
  const greenRoomLive = [show.upcomingEpisodes[0], show.pastEpisodes[0]].some(
    (episode) => episode && isGreenRoomWindow(episode),
  );

  const headerStats: EntitySocialStat[] = [
    ...(show.upcomingEpisodes.length > 0
      ? [
          {
            key: 'upcoming',
            label: t('radioShowViewMore.upcoming'),
            value: show.upcomingEpisodes.length,
            icon: CalendarIcon,
          },
        ]
      : []),
    ...(show.pastEpisodes.length > 0
      ? [
          {
            key: 'past',
            label: t('radioShowViewMore.pastEpisodes'),
            value: show.pastEpisodes.length,
            icon: RadioIcon,
          },
        ]
      : []),
  ];

  return (
    <PageFrame maxWidth="3xl">
      <PageBackLink to="/radio" label={t('radioShowView.radio')} />
      {loadError ? (
        <PageErrorBanner
          title={t('radioShowView.refreshError')}
          description={loadError}
          onRetry={retry}
        />
      ) : null}

      <EntitySocialHeader
        title={show.artist.displayName}
        imageUrl={
          show.artist.avatarUrl ??
          show.artist.coverUrl ??
          placeholderArtworkUrl(show.artist.username)
        }
        roundImage
        subtitle={
          <Link
            to="/u/$username"
            params={{ username: show.artist.username }}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            @{show.artist.username} · Show on Tahti Radio
          </Link>
        }
        description={
          show.artist.bio ? (
            <ClampedText className="whitespace-pre-wrap">
              {show.artist.bio}
            </ClampedText>
          ) : null
        }
        backdropUrl={show.artist.coverUrl}
        visualizerPreset="AURORA"
        artworkUrlForVisualizer={show.artist.avatarUrl}
        stats={headerStats}
        actions={
          greenRoomLive ? (
            <Tooltip content={t('radioShowView.greenRoom')} side="top">
              <ButtonLink
                to="/u/$username/green-room"
                params={{ username: show.artist.username }}
                size="icon-sm"
                variant="secondary"
                aria-label={t('radioShowView.openGreenRoom')}
                className="bg-background border-border rounded-md border-(length:--border-width)"
              >
                <MicIcon size={16} aria-hidden />
              </ButtonLink>
            </Tooltip>
          ) : null
        }
        data-testid="radio-show-social-header"
      />

      <NowPlayingSection
        track={nowPlayingTrack}
        upcoming={upcomingTracks}
        pollError={pollErrors.track ?? pollErrors.upcoming}
        onRetry={reloadNowPlaying}
      />

      <SectionShell title={t('radioShowView.episodes')}>
        <Tabs
          items={[
            {
              id: 'upcoming',
              label: t('radioShowViewMore.upcoming'),
              content: (
                <RadioShowEpisodeList
                  episodes={show.upcomingEpisodes}
                  emptyMessage={t('radioShowView.noUpcomingSlotsBookedRight')}
                />
              ),
            },
            {
              id: 'past',
              label: t('radioShowViewMore.pastEpisodes'),
              content: (
                <RadioShowEpisodeList
                  episodes={show.pastEpisodes}
                  emptyMessage={t('radioShowView.nothingHasAiredYet')}
                />
              ),
            },
          ]}
        />
      </SectionShell>
    </PageFrame>
  );
};
