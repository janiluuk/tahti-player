import { useEffect, useState } from 'react';

import type {
  ChannelNowPlaying,
  ChannelNowPlayingNext,
} from '../../api/channel-now-playing-types';
import {
  fetchRadioShowNowPlaying,
  fetchRadioShowUpcoming,
} from '../../api/shows';

/** First check fires when the track's time runs out; the rest back off
 * because the orchestrator poller only notices the change on its next sync. */
export const ROTATION_RETRY_DELAYS_MS = [0, 5_000, 10_000, 20_000];

type Advanced = {
  /** `startedAt` of the channel payload this update supersedes - once the
   * payload itself moves on (e.g. a background refetch), it wins again. */
  baseStartedAt: string | undefined;
  nowPlaying: ChannelNowPlaying;
  next: ChannelNowPlayingNext | null;
};

/** The channel payload's now-playing, advanced to the following track when
 * the current one runs out. Checks the lightweight now-playing endpoint a
 * few times around the end of each track and stops as soon as `startedAt`
 * changes, so there is no polling while a track is mid-play. */
export function useRotationNowPlaying(
  slug: string,
  base: ChannelNowPlaying | null,
  baseNext: ChannelNowPlayingNext | null | undefined,
): {
  nowPlaying: ChannelNowPlaying | null;
  next: ChannelNowPlayingNext | null;
} {
  const [advanced, setAdvanced] = useState<Advanced | null>(null);
  const baseStartedAt = base?.startedAt;
  const current =
    advanced && advanced.baseStartedAt === baseStartedAt ? advanced : null;
  const nowPlaying = current ? current.nowPlaying : base;
  const next = current ? current.next : (baseNext ?? null);
  const curated = baseNext != null;
  const startedAt = nowPlaying?.startedAt;
  const durationSec = nowPlaying?.durationSec;

  useEffect(() => {
    if (!startedAt || durationSec == null || !(durationSec > 0)) {
      return;
    }
    const startedMs = Date.parse(startedAt);
    if (!Number.isFinite(startedMs)) {
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async (): Promise<boolean> => {
      const res = await fetchRadioShowNowPlaying(slug).catch(() => null);
      const track = res?.data;
      if (cancelled || !track || track.startedAt === startedAt) {
        return false;
      }
      let upNext: ChannelNowPlayingNext | null = null;
      if (curated) {
        const upcoming = await fetchRadioShowUpcoming(slug).catch(() => null);
        if (cancelled) {
          return true;
        }
        const first = upcoming?.data[0];
        upNext = first
          ? {
              title: first.title,
              artistName: first.artistName,
              artistUsername: first.artistUsername,
            }
          : null;
      }
      setAdvanced({ baseStartedAt, nowPlaying: track, next: upNext });
      return true;
    };

    const schedule = (attempt: number) => {
      const delay =
        attempt === 0
          ? Math.max(0, startedMs + durationSec * 1000 - Date.now())
          : ROTATION_RETRY_DELAYS_MS[attempt]!;
      timer = setTimeout(() => {
        void check().then((changed) => {
          if (
            !changed &&
            !cancelled &&
            attempt + 1 < ROTATION_RETRY_DELAYS_MS.length
          ) {
            schedule(attempt + 1);
          }
        });
      }, delay);
    };
    schedule(0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, startedAt, durationSec, curated, baseStartedAt]);

  return { nowPlaying, next };
}
