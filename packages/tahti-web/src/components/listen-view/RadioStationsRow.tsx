import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { CardsRow } from '@tahti-player/ui';

import type { EnabledInternetRadioPreset } from '../../api/client';
import type { MyRadioStation } from '../../api/my-radio-stations';
import { fetchStationNowPlaying } from '../../api/radio-now-playing';
import type { TahtiPlayable } from '../../api/types';
import {
  radioStation,
  radioStationPlayable,
} from '../../content/radioStations';
import { usePolling } from '../../hooks/usePolling';
import { useLibraryStore } from '../../stores/libraryStore';
import { useListenerWidgetsStore } from '../../stores/listenerWidgetsStore';
import { usePlayerStore } from '../../stores/playerStore';
import { PageError } from '../PageStates';
import { RemoveWidgetDialog } from '../RemoveWidgetDialog';
import { ListenSection } from './ListenSection';
import { RadioRowCard, type RadioRowItem } from './RadioRowCard';
import type { ListenSectionState } from './useListenSections';

const NOW_PLAYING_POLL_MS = 45_000;

const ROW_LABELS = {
  filterPlaceholder: 'Filter stations…',
  nothingFound: 'Nothing matches that filter.',
};

function radioItemPlayable(
  item: RadioRowItem,
  nowPlaying?: string,
): TahtiPlayable | null {
  if (item.kind === 'catalog') {
    const streamUrl = item.station.streamUrl;
    return streamUrl
      ? radioStationPlayable({ ...item.station, streamUrl })
      : null;
  }
  const station =
    item.kind === 'preset'
      ? {
          name: item.preset.name,
          iconUrl: item.preset.iconUrl,
          streamUrl: item.preset.streamUrl,
        }
      : item.station;
  if (!station.streamUrl) {
    return null;
  }
  return {
    id: item.id,
    kind: 'radio',
    title: nowPlaying ?? station.name,
    artist: station.name,
    coverUrl: station.iconUrl ?? undefined,
    streamUrl: station.streamUrl,
    protocol: 'https',
    sourceProvider: 'internet-radio',
  };
}

export function RadioStationsRow({
  presets,
  setPresets,
  onRetry,
  ownStations = [],
  signedIn,
  'data-testid': testId = 'listen-radio',
}: {
  presets: ListenSectionState<EnabledInternetRadioPreset[]>;
  setPresets: Dispatch<SetStateAction<EnabledInternetRadioPreset[]>>;
  onRetry: () => void;
  ownStations?: MyRadioStation[];
  signedIn: boolean;
  'data-testid'?: string;
}) {
  const playFromList = usePlayerStore((s) => s.playFromList);
  const currentId = usePlayerStore((s) => s.currentId);
  const playbackStatus = usePlayerStore((s) => s.status);
  const setPlaybackStatus = usePlayerStore((s) => s.setStatus);
  const favoriteTracks = useLibraryStore((s) => s.favoriteTracks);
  const toggleFavoriteTrack = useLibraryStore((s) => s.toggleFavoriteTrack);
  const enabledStationIds = useListenerWidgetsStore((s) => s.enabledStationIds);
  const stationOverrides = useListenerWidgetsStore((s) => s.stationOverrides);
  const toggleStation = useListenerWidgetsStore((s) => s.toggleStation);
  const [pendingRemoval, setPendingRemoval] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [presetNowPlaying, setPresetNowPlaying] = useState<
    Record<string, string>
  >({});
  const refreshInFlight = useRef(false);
  const radioPresets = presets.data;

  const refreshPresetNowPlaying = useCallback(async () => {
    if (radioPresets.length === 0 || refreshInFlight.current) {
      return;
    }
    refreshInFlight.current = true;
    try {
      const entries = await Promise.all(
        radioPresets.map(async (preset) => {
          const title = await fetchStationNowPlaying({
            programmingUrl: preset.programmingUrl,
            streamUrl: preset.streamUrl,
          });
          return [preset.id, title] as const;
        }),
      );
      const next: Record<string, string> = {};
      for (const [id, title] of entries) {
        if (title) {
          next[id] = title;
        }
      }
      setPresetNowPlaying(next);
    } catch {
      return;
    } finally {
      refreshInFlight.current = false;
    }
  }, [radioPresets]);

  useEffect(() => {
    void refreshPresetNowPlaying();
  }, [refreshPresetNowPlaying]);

  usePolling(
    () => void refreshPresetNowPlaying(),
    NOW_PLAYING_POLL_MS,
    radioPresets.length > 0,
  );

  // Catalog stations (packages/tahti-web/src/content/radioStations.ts) fill
  // in any station that doesn't already have a board-curated preset enabled
  // for it (matched by name) — the preset's admin-uploaded artwork wins when
  // both exist for the same station.
  const items = useMemo<RadioRowItem[]>(() => {
    const presetNames = new Set(radioPresets.map((preset) => preset.name));
    const catalog = enabledStationIds
      .map((id) => {
        const station = radioStation(id);
        return station ? { ...station, ...stationOverrides[id] } : undefined;
      })
      .filter((station) => station != null)
      .filter((station) => !presetNames.has(station.name));
    return [
      ...radioPresets.map((preset) => ({
        id: `radio-preset:${preset.id}`,
        title: preset.name,
        kind: 'preset' as const,
        preset,
      })),
      ...catalog.map((station) => ({
        id: `radio-widget:${station.id}`,
        title: station.name,
        kind: 'catalog' as const,
        station,
      })),
      ...ownStations.map((station) => ({
        id: `radio:my-${station.id}`,
        title: station.name,
        kind: 'mine' as const,
        station,
      })),
    ];
  }, [radioPresets, enabledStationIds, stationOverrides, ownStations]);

  const nowPlayingFor = (item: RadioRowItem) =>
    item.kind === 'preset' ? presetNowPlaying[item.preset.id] : undefined;

  const playables = useMemo(
    () =>
      items
        .map((item) =>
          radioItemPlayable(
            item,
            item.kind === 'preset'
              ? presetNowPlaying[item.preset.id]
              : undefined,
          ),
        )
        .filter((playable): playable is TahtiPlayable => playable != null),
    [items, presetNowPlaying],
  );

  const isActive = (id: string) =>
    currentId === id &&
    (playbackStatus === 'playing' || playbackStatus === 'loading');

  const togglePlay = (id: string) => {
    if (currentId === id) {
      setPlaybackStatus(isActive(id) ? 'paused' : 'playing');
      return;
    }
    const index = playables.findIndex((playable) => playable.id === id);
    if (index >= 0) {
      playFromList(playables, index);
    }
  };

  const favoriteIds = new Set(favoriteTracks.map((track) => track.id));

  return (
    <>
      <ListenSection
        data-testid={testId}
        title="Radio"
        badge="Internet radio"
        badgeColor="cyan"
        status={items.length > 0 ? 'ready' : presets.status}
        empty={items.length === 0}
        emptyTitle="No radio stations yet"
        emptyDescription={
          signedIn ? 'Add stations from the widget store.' : undefined
        }
        onRetry={onRetry}
      >
        <CardsRow
          data-testid={testId}
          title="Radio"
          badge="Internet radio"
          badgeColor="cyan"
          items={items}
          labels={ROW_LABELS}
          renderItem={(item) => {
            const favorite = radioItemPlayable(item);
            return (
              <RadioRowCard
                item={item}
                isPlaying={isActive(item.id)}
                nowPlaying={nowPlayingFor(item)}
                onPlay={() => togglePlay(item.id)}
                onCoverChange={(presetId, iconUrl) =>
                  setPresets((current) =>
                    current.map((entry) =>
                      entry.id === presetId ? { ...entry, iconUrl } : entry,
                    ),
                  )
                }
                onRemove={(station) =>
                  setPendingRemoval({ id: station.id, label: station.name })
                }
                favorited={favoriteIds.has(item.id)}
                onFavorite={
                  favorite ? () => toggleFavoriteTrack(favorite) : undefined
                }
              />
            );
          }}
        />
        {presets.status === 'error' ? (
          <PageError title="Curated stations couldn't load" onRetry={onRetry} />
        ) : null}
      </ListenSection>
      <RemoveWidgetDialog
        isOpen={pendingRemoval != null}
        label={pendingRemoval?.label ?? ''}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) {
            toggleStation(pendingRemoval.id);
          }
          setPendingRemoval(null);
        }}
      />
    </>
  );
}
