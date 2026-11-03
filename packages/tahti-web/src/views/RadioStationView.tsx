import { Link } from '@tanstack/react-router';
import { CalendarDaysIcon, GlobeIcon } from 'lucide-react';

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
        title="Station not found"
        description="This radio station isn't in the Tahti station list."
        action={
          <Link to="/radio" className="text-sm underline">
            Back to radio
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

  return (
    <ViewShell
      title={station.name}
      subtitle={`${station.genre} · ${station.language}`}
      data-testid="radio-station-page"
      classes={{ content: 'gap-6' }}
      corner={
        <Tooltip
          content="Back to radio"
          side="right"
          wrapperClassName={backButtonCornerClassName}
        >
          <BackButtonLink to="/radio" aria-label="Back to radio" />
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
              playLabel={`Play ${station.name}`}
              pauseLabel={`Pause ${station.name}`}
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
                  Playing
                </Badge>
              ) : null}
            </div>
            <div role="status" aria-live="polite" className="text-sm">
              {nowPlaying ? (
                <p>
                  <span className="text-foreground-secondary">On air: </span>
                  <span className="font-semibold">{nowPlaying}</span>
                </p>
              ) : (
                <p className="text-foreground-secondary">
                  {streamUrl
                    ? 'This station doesn’t say what’s playing.'
                    : 'No stream address for this station yet.'}
                </p>
              )}
            </div>
            <div
              role="group"
              aria-label="Station controls"
              className="flex flex-wrap gap-2"
            >
              <Button
                type="button"
                variant="secondary"
                aria-pressed={onListen}
                onClick={() => toggleStation(station.id)}
              >
                {onListen ? 'Remove from Listen' : 'Add to Listen'}
              </Button>
            </div>
            {playable ? (
              <StationUnavailableNotice
                playableId={playable.id}
                streamUrl={playable.streamUrl}
                onPlay={() => play(playable)}
              />
            ) : null}
            <div className="flex items-center gap-2">
              <Tooltip content="Station website" side="top">
                <ButtonAnchor
                  href={station.detailUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  size="icon-sm"
                  variant="secondary"
                  aria-label={`${station.name} website`}
                >
                  <GlobeIcon size={16} aria-hidden />
                </ButtonAnchor>
              </Tooltip>
              {station.programmingUrl &&
              station.programmingUrl !== station.detailUrl ? (
                <Tooltip content="Programme guide" side="top">
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
        title="Other stations"
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
    </ViewShell>
  );
}
