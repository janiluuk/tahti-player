import { Link } from '@tanstack/react-router';
import {
  CalendarDaysIcon,
  GlobeIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  backButtonCornerClassName,
  BackButtonLink,
  Badge,
  Button,
  ButtonAnchor,
  CardsRow,
  MediaArtwork,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import { RadioRowCard } from '../components/listen-view/RadioRowCard';
import { PageEmpty } from '../components/PageStates';
import { RadioStationDial } from '../components/radio/RadioStationDial';
import { RadioStationCoverEditButton } from '../components/RadioStationCover';
import { RemoveWidgetDialog } from '../components/RemoveWidgetDialog';
import { StationUnavailableNotice } from '../components/StationUnavailableNotice';
import {
  RADIO_STATIONS,
  radioStation,
  radioStationPlayable,
  stationNowPlayingSource,
} from '../content/radioStations';
import { useStationNowPlaying } from '../hooks/useStationNowPlaying';
import { useListenerWidgetsStore } from '../stores/listenerWidgetsStore';
import { usePlayerStore } from '../stores/playerStore';

/** In-app page for one of the curated external stations in
 * `content/radioStations.ts`, instead of sending listeners off to the
 * broadcaster's site. */
export function RadioStationView({ stationId }: { stationId: string }) {
  const { t } = useTranslation('web');
  const base = radioStation(stationId);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const override = stationOverrides[stationId];
  const onListen = useListenerWidgetsStore((s) =>
    s.enabledStationIds.includes(stationId),
  );
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const play = usePlayerStore((s) => s.play);
  const currentId = usePlayerStore((s) => s.currentId);
  const status = usePlayerStore((s) => s.status);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const station = base ? { ...base, ...override } : undefined;
  const streamUrl = station?.streamUrl ?? null;
  const nowPlayingSource = station ? stationNowPlayingSource(station) : null;
  const nowPlaying = useStationNowPlaying(
    nowPlayingSource?.programmingUrl,
    nowPlayingSource?.streamUrl,
  );

  if (!station) {
    return (
      <PageEmpty
        headingLevel={1}
        icon="radio"
        title={t('radioStation.notFoundTitle')}
        description={t('radioStation.notFoundDescription')}
        action={
          <Link to="/radio" className="text-sm underline">
            {t('radioStation.backToRadio')}
          </Link>
        }
      />
    );
  }

  const playable = streamUrl
    ? radioStationPlayable({ ...station, streamUrl })
    : null;
  const current = playable !== null && currentId === playable.id;
  const playing = current && (status === 'playing' || status === 'loading');
  const togglePlay = () => {
    if (!playable) {
      return;
    }
    if (current) {
      setStatus(playing ? 'paused' : 'playing');
      return;
    }
    play(playable);
  };
  const others = RADIO_STATIONS.filter((item) => item.id !== station.id).map(
    (item) => ({ ...item, ...stationOverrides[item.id] }),
  );
  const listenLabel = onListen
    ? t('radioStation.removeFromListen')
    : t('radioStation.addToListen');

  return (
    <ViewShell
      title={station.name}
      subtitle={`${station.genre} · ${station.language}`}
      data-testid="radio-station-page"
      classes={{ content: 'gap-6' }}
      corner={
        <Tooltip
          content={t('radioStation.backToRadio')}
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink
            to="/radio"
            aria-label={t('radioStation.backToRadio')}
          />
        </Tooltip>
      }
    >
      <RadioStationDial
        current={{ kind: 'station', id: station.id }}
        label={station.name}
        buttonsClassName="top-0 right-0"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:pr-20">
          <div className="group relative shrink-0" data-testid="station-cover">
            <MediaArtwork
              src={station.logoUrl}
              alt={`${station.name} logo`}
              size="lg"
              onPlay={playable ? togglePlay : undefined}
              isPlaying={playing}
              playLabel={t('actions.playItem', { title: station.name })}
              pauseLabel={t('actions.pauseItem', { title: station.name })}
              playDisabled={!playable}
            />
            <div className="absolute top-2 right-2 z-[2]">
              <RadioStationCoverEditButton
                label={station.name}
                stationName={base?.name ?? station.name}
                catalogStationId={station.id}
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pill" color="blue">
                {station.codec} · {station.bitrateKbps} kbps
              </Badge>
              {playing ? (
                <Badge variant="pill" color="red">
                  {t('radioStation.playing')}
                </Badge>
              ) : null}
            </div>
            <div role="status" aria-live="polite" className="text-sm">
              {nowPlaying ? (
                <p>
                  <span className="text-foreground-secondary">
                    {t('radioStation.onAir')}{' '}
                  </span>
                  <span className="font-semibold">{nowPlaying}</span>
                </p>
              ) : (
                <p className="text-foreground-secondary">
                  {streamUrl
                    ? t('radioStation.noNowPlaying')
                    : t('radioStation.noStream')}
                </p>
              )}
            </div>
            {playable ? (
              <StationUnavailableNotice
                playableId={playable.id}
                streamUrl={playable.streamUrl}
                onPlay={() => play(playable)}
              />
            ) : null}
            <div
              role="group"
              aria-label={t('radioStation.controlsAria')}
              className="flex flex-wrap items-center gap-2"
            >
              <Tooltip content={listenLabel} side="top">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="secondary"
                  aria-label={listenLabel}
                  aria-pressed={onListen}
                  data-testid="station-listen-toggle"
                  onClick={() => {
                    if (onListen) {
                      setConfirmRemove(true);
                      return;
                    }
                    toggleStation(station.id);
                  }}
                >
                  {onListen ? (
                    <Trash2Icon
                      size={16}
                      aria-hidden
                      className="text-accent-red-strong"
                    />
                  ) : (
                    <PlusIcon size={16} aria-hidden />
                  )}
                </Button>
              </Tooltip>
              {station.detailUrl ? (
                <Tooltip content={t('radioStation.stationWebsite')} side="top">
                  <ButtonAnchor
                    href={station.detailUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="icon-sm"
                    variant="secondary"
                    aria-label={`${station.name} website`}
                    data-testid="station-website"
                  >
                    <GlobeIcon size={16} aria-hidden />
                  </ButtonAnchor>
                </Tooltip>
              ) : null}
              {station.programmingUrl &&
              station.programmingUrl !== station.detailUrl ? (
                <Tooltip content={t('radioStation.programmeGuide')} side="top">
                  <ButtonAnchor
                    href={station.programmingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    size="icon-sm"
                    variant="secondary"
                    aria-label={`${station.name} programme guide`}
                  >
                    <CalendarDaysIcon size={16} aria-hidden />
                  </ButtonAnchor>
                </Tooltip>
              ) : null}
            </div>
          </div>
        </div>
      </RadioStationDial>
      <CardsRow
        title={t('radioStation.otherStations')}
        data-testid="other-stations"
        items={others.map((item) => ({
          id: `radio-widget:${item.id}`,
          title: item.name,
          kind: 'catalog' as const,
          station: item,
        }))}
        labels={{
          filterPlaceholder: 'Filter stations…',
          nothingFound: 'No stations match that filter.',
        }}
        renderItem={(item) => {
          const isPlaying =
            currentId === item.id &&
            (status === 'playing' || status === 'loading');
          return (
            <RadioRowCard
              item={item}
              isPlaying={isPlaying}
              onPlay={() => {
                if (currentId === item.id) {
                  setStatus(isPlaying ? 'paused' : 'playing');
                } else if (item.station.streamUrl) {
                  play(
                    radioStationPlayable({
                      ...item.station,
                      streamUrl: item.station.streamUrl,
                    }),
                  );
                }
              }}
            />
          );
        }}
      />
      <RemoveWidgetDialog
        isOpen={confirmRemove}
        label={station.name}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          toggleStation(station.id);
          setConfirmRemove(false);
        }}
      />
    </ViewShell>
  );
}
