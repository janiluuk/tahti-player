import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import {
  Box,
  SegmentedControl,
  StatTile,
  TopList,
  type SegmentedControlOption,
} from '@tahti-player/ui';

import {
  fetchMyListening,
  type MyListening,
  type MyListeningRange,
} from '../../api/me-listening';
import { formatListeningDuration } from '../../lib/historyStats';
import { useAuthStore } from '../../stores/authStore';
import { PageError, PageLoading } from '../PageStates';

const RANGE_OPTIONS: SegmentedControlOption<MyListeningRange>[] = [
  { id: '7', label: '7 days' },
  { id: '30', label: '30 days' },
  { id: 'all', label: 'All time' },
];

const minutesLabel = (minutes: number) =>
  formatListeningDuration(minutes * 60_000);

export function AcrossDevicesPanel() {
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const navigate = useNavigate();
  const [range, setRange] = useState<MyListeningRange>('30');
  const [listening, setListening] = useState<MyListening | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let cancelled = false;
    setStatus('loading');
    void fetchMyListening(range).then((result) => {
      if (cancelled) {
        return;
      }
      setListening(result.data);
      setStatus(result.data ? 'ready' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, range, attempt]);

  if (!signedIn) {
    return null;
  }

  return (
    <section
      className="flex flex-col gap-3"
      aria-labelledby="across-devices-title"
      data-testid="history-across-devices"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="across-devices-title" className="text-lg font-bold">
            Across your devices
          </h2>
          <p className="text-foreground-secondary text-sm">
            Everything you listened to on Tahti while signed in, on any device.
          </p>
        </div>
        <SegmentedControl
          aria-label="Period"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      </div>
      {status === 'loading' ? (
        <PageLoading label="Loading your listening…" />
      ) : status === 'error' || !listening ? (
        <PageError
          title="Could not load your listening"
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <StatTile
              label="Time listened"
              value={minutesLabel(listening.minutes)}
            />
            <StatTile
              label="Listens"
              value={listening.listens.toLocaleString()}
            />
          </div>
          {listening.topArtists.length > 0 || listening.topTracks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {listening.topArtists.length > 0 ? (
                <Box variant="tertiary" className="min-w-0 flex-col">
                  <TopList
                    data-testid="across-devices-artists"
                    title="Top artists"
                    entries={listening.topArtists.map((artist) => ({
                      id: artist.username,
                      label: artist.displayName,
                      imageUrl: artist.avatarUrl,
                      value: artist.minutes * 60_000,
                      onClick: () =>
                        void navigate({
                          to: '/u/$username',
                          params: { username: artist.username },
                        }),
                    }))}
                    formatValue={formatListeningDuration}
                  />
                </Box>
              ) : null}
              {listening.topTracks.length > 0 ? (
                <Box variant="tertiary" className="min-w-0 flex-col">
                  <TopList
                    data-testid="across-devices-tracks"
                    title="Top tracks"
                    entries={listening.topTracks.map((track) => ({
                      id: track.soundId,
                      label: track.title,
                      sublabel: track.artistName,
                      value: track.minutes * 60_000,
                      onClick: () =>
                        void navigate({
                          to: '/t/$id',
                          params: { id: track.soundId },
                        }),
                    }))}
                    formatValue={formatListeningDuration}
                  />
                </Box>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
