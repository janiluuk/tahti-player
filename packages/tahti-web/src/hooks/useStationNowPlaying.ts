import { useCallback, useEffect, useState } from 'react';

import { fetchStationNowPlaying } from '../api/radio-now-playing';
import { usePolling } from './usePolling';

const POLL_MS = 30_000;

/** What a radio station is playing, refreshed every 30 seconds while the
 * component is mounted. Null until known, or when the station says nothing. */
export function useStationNowPlaying(
  programmingUrl: string | null | undefined,
  streamUrl: string | null | undefined,
): string | null {
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!programmingUrl && !streamUrl) {
      return;
    }
    setNowPlaying(await fetchStationNowPlaying({ programmingUrl, streamUrl }));
  }, [programmingUrl, streamUrl]);

  useEffect(() => {
    setNowPlaying(null);
    void refresh();
  }, [refresh]);

  usePolling(
    () => void refresh(),
    POLL_MS,
    Boolean(programmingUrl || streamUrl),
  );

  return nowPlaying;
}
