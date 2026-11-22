import { Link } from '@tanstack/react-router';
import { XIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Card, InlineError, Tooltip } from '@tahti-player/ui';

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
import { streamFailureLabel } from '../../lib/streamFailure';
import type { SavedBrowserStation } from '../../stores/listenerWidgetsStore';
import { useStationFailure } from '../StationUnavailableNotice';
import { StationCardSubtitle } from './StationCardSubtitle';

export type RadioRowItem =
  | {
      id: string;
      title: string;
      kind: 'preset';
      preset: EnabledInternetRadioPreset;
    }
  | { id: string; title: string; kind: 'catalog'; station: RadioStation }
  | { id: string; title: string; kind: 'mine'; station: MyRadioStation }
  | {
      id: string;
      title: string;
      kind: 'saved';
      station: SavedBrowserStation;
    };

function RemoveStationButton({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  const { t } = useTranslation('web');
  const label = t('radioRowCardLabels.removeName', { name });
  return (
    <Tooltip content={label} side="top">
      <Button
        size="icon-sm"
        variant="text"
        aria-label={label}
        onClick={onRemove}
        className="bg-background/80 hover:bg-background absolute top-1 right-1 z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <XIcon size={14} aria-hidden />
      </Button>
    </Tooltip>
  );
}

/** One card in the Listen "Radio" row: a board-curated preset, a catalog
 * station the listener enabled, a Radio Browser station they saved (both
 * removable), or a station on their account. */
export function RadioRowCard({
  item,
  isPlaying,
  nowPlaying,
  onPlay,
  onRemove,
  favorited,
  onFavorite,
}: {
  item: RadioRowItem;
  isPlaying: boolean;
  nowPlaying?: string;
  onPlay: () => void;
  onRemove?: () => void;
  favorited?: boolean;
  onFavorite?: () => void;
}) {
  const { t } = useTranslation('web');
  const warmRadioRoute = () => prefetchListenCardIntent('radio');
  const catalogStation =
    item.kind === 'preset'
      ? RADIO_STATIONS.find((station) => station.name === item.preset.name)
      : undefined;
  const presetLogo = useImageWithFallback(
    item.kind === 'preset' ? item.preset.iconUrl : null,
    catalogStation?.logoUrl,
  );
  const failure = useStationFailure(
    item.id,
    item.kind === 'preset' ? item.preset.streamUrl : item.station.streamUrl,
  );
  const unavailable = failure ? (
    <InlineError textSize="xs" announce={false}>
      {t('radioRowCardLeftovers.stationUnavailable', {
        reason: streamFailureLabel(failure),
      })}
    </InlineError>
  ) : null;
  const failedPlayLabel = failure
    ? t('radioRowCardLeftovers.tryAgain')
    : undefined;
  if (item.kind === 'mine') {
    const { station } = item;
    return (
      <Card
        surface="neutral"
        title={station.name}
        subtitle={
          unavailable ?? (
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
          )
        }
        playLabel={failedPlayLabel}
        itemName={station.name}
        src={station.iconUrl ?? placeholderArtworkUrl(item.id)}
        isPlaying={isPlaying}
        playDisabled={!station.streamUrl}
        onPlay={station.streamUrl ? onPlay : undefined}
        favorited={favorited}
        onFavorite={onFavorite}
      />
    );
  }
  if (item.kind === 'saved') {
    const { station } = item;
    return (
      <div className="group relative w-fit">
        {onRemove ? (
          <RemoveStationButton name={station.name} onRemove={onRemove} />
        ) : null}
        <Card
          surface="neutral"
          title={station.name}
          subtitle={
            unavailable ?? (
              <StationCardSubtitle
                source={{
                  programmingUrl: station.programmingUrl ?? null,
                  streamUrl: station.streamUrl,
                }}
                fallback={
                  station.country ??
                  t('listenerWidgetsSectionText.internetRadio')
                }
              />
            )
          }
          playLabel={failedPlayLabel}
          itemName={station.name}
          src={station.favicon ?? placeholderArtworkUrl(item.id)}
          isPlaying={isPlaying}
          onPlay={onPlay}
          favorited={favorited}
          onFavorite={onFavorite}
        />
      </div>
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
            unavailable ??
            (!preset.streamUrl
              ? 'Off air'
              : (nowPlaying ?? preset.genre ?? 'Internet radio'))
          }
          playLabel={failedPlayLabel}
          itemName={preset.name}
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
      {onRemove ? (
        <RemoveStationButton name={station.name} onRemove={onRemove} />
      ) : null}
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
          unavailable ?? (
            <StationCardSubtitle
              source={stationNowPlayingSource(station)}
              fallback={
                streamUrl
                  ? `${station.language} · ${station.bitrateKbps}kbps`
                  : 'Off air'
              }
            />
          )
        }
        itemName={station.name}
        src={station.logoUrl}
        isPlaying={isPlaying}
        playLabel={
          failedPlayLabel ?? (streamUrl ? undefined : 'Stream pending')
        }
        playDisabled={!streamUrl}
        onPlay={streamUrl ? onPlay : undefined}
        favorited={favorited}
        onFavorite={onFavorite}
      />
    </div>
  );
}
