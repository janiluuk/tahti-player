import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchStationNowPlaying } from '../api/radio-now-playing';
import {
  radioStation,
  radioStationIdForPlayable,
  stationNowPlayingSource,
} from '../content/radioStations';
import { usePlayerStore } from '../stores/playerStore';
import { usePolling } from './usePolling';

const POLL_MS = 30_000;

/** What a radio station is playing, refreshed every 30 seconds while
 * `enabled` and the tab is visible. Null until known, or when the station
 * says nothing. The last answer stays while polling is paused. */
export function useStationNowPlaying(
  programmingUrl: string | null | undefined,
  streamUrl: string | null | undefined,
  enabled = true,
): string | null {
  const key = `${programmingUrl ?? ''}\n${streamUrl ?? ''}`;
  const [answer, setAnswer] = useState<{
    key: string;
    value: string | null;
  } | null>(null);
  const keyRef = useRef(key);
  keyRef.current = key;
  const active = enabled && Boolean(programmingUrl || streamUrl);

  const refresh = useCallback(async () => {
    const value = await fetchStationNowPlaying({ programmingUrl, streamUrl });
    // A slow answer for a station the caller has since left is dropped.
    if (keyRef.current === key) {
      setAnswer({ key, value });
    }
  }, [key, programmingUrl, streamUrl]);

  useEffect(() => {
    if (active) {
      void refresh();
    }
  }, [active, refresh]);

  usePolling(() => void refresh(), POLL_MS, active);

  return answer?.key === key ? answer.value : null;
}

type PlayerPlayable = {
  id: string;
  title: string;
  artist: string;
  streamUrl?: string | null;
};

/** The title and artist lines for a catalog radio station in the player:
 * what the station says is on, with the station's name second. Null when
 * the playable is not a catalog station or nothing is known, so callers
 * keep the playable's own lines. Polls only while the station plays. */
export function usePlayerStationNowPlaying(
  playable: PlayerPlayable | null | undefined,
): { title: string; artist: string } | null {
  const status = usePlayerStore((s) => s.status);
  const station = playable
    ? radioStation(radioStationIdForPlayable(playable) ?? '')
    : undefined;
  const source = station
    ? stationNowPlayingSource({
        ...station,
        streamUrl: playable?.streamUrl ?? station.streamUrl,
      })
    : null;
  const nowPlaying = useStationNowPlaying(
    source?.programmingUrl,
    source?.streamUrl,
    status === 'playing' || status === 'loading',
  );
  return station && nowPlaying
    ? { title: nowPlaying, artist: station.name }
    : null;
}
