import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
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
import { dateLocaleTag } from '../../lib/locale';
import { useAuthStore } from '../../stores/authStore';
import { PageError, PageLoading } from '../PageStates';

const minutesLabel = (minutes: number) =>
  formatListeningDuration(minutes * 60_000);

export function AcrossDevicesPanel({
  onHasListening,
}: {
  onHasListening?: (hasListening: boolean) => void;
} = {}) {
  const { t } = useTranslation('web');
  const signedIn = useAuthStore((s) => Boolean(s.user));
  const navigate = useNavigate();
  const RANGE_OPTIONS: SegmentedControlOption<MyListeningRange>[] = [
    { id: '7', label: t('library.days7') },
    { id: '30', label: t('library.days30') },
    { id: 'all', label: t('library.allTime') },
  ];
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

  const hasListening =
    signedIn && status === 'ready' && (listening?.listens ?? 0) > 0;
  useEffect(() => {
    onHasListening?.(hasListening);
  }, [hasListening, onHasListening]);

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
            {t('library.acrossDevicesTitle')}
          </h2>
          <p className="text-foreground-secondary text-sm">
            {t('library.acrossDevicesDescription')}
          </p>
        </div>
        <SegmentedControl
          aria-label={t('library.period')}
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
        />
      </div>
      {status === 'loading' ? (
        <PageLoading label={t('library.loadingListening')} />
      ) : status === 'error' || !listening ? (
        <PageError
          title={t('library.listeningLoadError')}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <StatTile
              label={t('library.timeListened')}
              value={minutesLabel(listening.minutes)}
            />
            <StatTile
              label={t('library.listens')}
              value={listening.listens.toLocaleString(dateLocaleTag())}
            />
          </div>
          {listening.topArtists.length > 0 || listening.topTracks.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {listening.topArtists.length > 0 ? (
                <Box variant="tertiary" className="min-w-0 flex-col">
                  <TopList
                    data-testid="across-devices-artists"
                    title={t('library.topArtists')}
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
                    title={t('library.topTracks')}
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
