import { Link } from '@tanstack/react-router';

import {
  Badge,
  Button,
  ExternalLink,
  MediaArtwork,
  ViewShell,
} from '@tahti-player/ui';

import { PageEmpty } from '../components/PageStates';
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
  const override = useListenerWidgetsStore(
    (s) => s.stationOverrides[stationId],
  );
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
  const others = RADIO_STATIONS.filter((item) => item.id !== station.id);

  return (
    <ViewShell
      title={station.name}
      subtitle={`${station.genre} · ${station.language}`}
      data-testid="radio-station-page"
      classes={{ content: 'gap-6' }}
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <MediaArtwork
          src={station.logoUrl}
          alt={`${station.name} logo`}
          size="lg"
        />
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={togglePlay} disabled={!playable}>
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              aria-pressed={onListen}
              onClick={() => toggleStation(station.id)}
            >
              {onListen ? 'Remove from Listen' : 'Add to Listen'}
            </Button>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <ExternalLink
              href={station.detailUrl}
              className="text-accent-blue-strong"
            >
              Station website
            </ExternalLink>
            {station.programmingUrl &&
            station.programmingUrl !== station.detailUrl ? (
              <ExternalLink
                href={station.programmingUrl}
                className="text-accent-blue-strong"
              >
                Programme guide
              </ExternalLink>
            ) : null}
          </div>
        </div>
      </div>
      <section aria-labelledby="other-stations" className="flex flex-col gap-2">
        <h2 id="other-stations" className="text-sm font-bold tracking-tight">
          Other stations
        </h2>
        <ul className="flex flex-wrap gap-2">
          {others.map((item) => (
            <li key={item.id}>
              <Link
                to="/radio/station/$stationId"
                params={{ stationId: item.id }}
                className="border-border hover:border-primary/50 inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </ViewShell>
  );
}
