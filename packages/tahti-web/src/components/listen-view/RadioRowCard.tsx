import { Link } from '@tanstack/react-router';
import { XIcon } from 'lucide-react';

import { Button, Card, Tooltip } from '@tahti-player/ui';

import type { EnabledInternetRadioPreset } from '../../api/client';
import type { MyRadioStation } from '../../api/my-radio-stations';
import {
  RADIO_STATIONS,
  stationNowPlayingSource,
  type RadioStation,
} from '../../content/radioStations';
import { useImageWithFallback } from '../../hooks/useImageWithFallback';
import { prefetchListenCardIntent } from '../../lib/intentRoutePrefetch';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { RadioStationCoverEditButton } from '../RadioStationCover';
import { StationCardSubtitle } from './StationCardSubtitle';

export type RadioRowItem =
  | {
      id: string;
      title: string;
      kind: 'preset';
      preset: EnabledInternetRadioPreset;
    }
  | { id: string; title: string; kind: 'catalog'; station: RadioStation }
  | { id: string; title: string; kind: 'mine'; station: MyRadioStation };

/** One card in the Listen "Radio" row: a board-curated preset, or a catalog
 * station the listener enabled (removable). */
export function RadioRowCard({
  item,
  isPlaying,
  nowPlaying,
  onPlay,
  onCoverChange,
  onRemove,
  favorited,
  onFavorite,
}: {
  item: RadioRowItem;
  isPlaying: boolean;
  nowPlaying?: string;
  onPlay: () => void;
  onCoverChange: (presetId: string, iconUrl: string | null) => void;
  onRemove: (station: RadioStation) => void;
  favorited?: boolean;
  onFavorite?: () => void;
}) {
  const warmRadioRoute = () => prefetchListenCardIntent('radio');
  const catalogStation =
    item.kind === 'preset'
      ? RADIO_STATIONS.find((station) => station.name === item.preset.name)
      : undefined;
  const presetLogo = useImageWithFallback(
    item.kind === 'preset' ? item.preset.iconUrl : null,
    catalogStation?.logoUrl,
  );
  if (item.kind === 'mine') {
    const { station } = item;
    return (
      <Card
        surface="neutral"
        title={station.name}
        subtitle={
          <StationCardSubtitle
            source={{
              programmingUrl: station.programmingUrl,
              streamUrl: station.streamUrl,
            }}
            fallback={
              station.streamUrl
                ? (station.genre ?? 'Your station')
                : 'Stream pending'
            }
          />
        }
        src={station.iconUrl ?? placeholderArtworkUrl(item.id)}
        isPlaying={isPlaying}
        playDisabled={!station.streamUrl}
        onPlay={station.streamUrl ? onPlay : undefined}
        favorited={favorited}
        onFavorite={onFavorite}
      />
    );
  }
  if (item.kind === 'preset') {
    const { preset } = item;
    const catalogId = catalogStation?.id;
    return (
      <div
        className="group relative w-fit"
        onPointerEnter={catalogId ? warmRadioRoute : undefined}
        onFocus={catalogId ? warmRadioRoute : undefined}
      >
        <RadioStationCoverEditButton
          label={preset.name}
          stationName={preset.name}
          catalogStationId={catalogId}
          presetId={preset.id}
          className="absolute top-3 left-3 z-10 rounded-full"
          onCoverChange={(iconUrl) => onCoverChange(preset.id, iconUrl)}
        />
        <Card
          surface="neutral"
          title={
            catalogId ? (
              <Link
                to="/radio/station/$stationId"
                params={{ stationId: catalogId }}
                className="hover:underline"
              >
                {preset.name}
              </Link>
            ) : (
              preset.name
            )
          }
          subtitle={
            !preset.streamUrl
              ? 'Off air'
              : (nowPlaying ?? preset.genre ?? 'Internet radio')
          }
          src={presetLogo ?? placeholderArtworkUrl(item.id)}
          isPlaying={isPlaying}
          playDisabled={!preset.streamUrl}
          onPlay={() => {
            if (preset.streamUrl) {
              onPlay();
            }
          }}
          favorited={favorited}
          onFavorite={onFavorite}
        />
      </div>
    );
  }
  const { station } = item;
  const streamUrl = station.streamUrl;
  return (
    <div
      className="group relative w-fit"
      onPointerEnter={warmRadioRoute}
      onFocus={warmRadioRoute}
    >
      <RadioStationCoverEditButton
        label={station.name}
        stationName={station.name}
        catalogStationId={station.id}
        className="absolute top-3 left-3 z-10 rounded-full"
      />
      <Tooltip content={`Remove ${station.name}`} side="top">
        <Button
          size="icon-sm"
          variant="text"
          aria-label={`Remove ${station.name}`}
          onClick={() => onRemove(station)}
          className="bg-background/80 hover:bg-background absolute top-1 right-1 z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <XIcon size={14} aria-hidden />
        </Button>
      </Tooltip>
      <Card
        surface="neutral"
        title={
          <Link
            to="/radio/station/$stationId"
            params={{ stationId: station.id }}
            className="hover:underline"
          >
            {station.name}
          </Link>
        }
        subtitle={
          <StationCardSubtitle
            source={stationNowPlayingSource(station)}
            fallback={
              streamUrl
                ? `${station.language} · ${station.bitrateKbps}kbps`
                : 'Off air'
            }
          />
        }
        src={station.logoUrl}
        isPlaying={isPlaying}
        playLabel={streamUrl ? 'Play' : 'Stream pending'}
        playDisabled={!streamUrl}
        onPlay={streamUrl ? onPlay : undefined}
        favorited={favorited}
        onFavorite={onFavorite}
      />
    </div>
  );
}
