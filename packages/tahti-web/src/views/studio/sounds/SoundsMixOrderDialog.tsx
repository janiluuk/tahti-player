import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

import {
  suggestSoundMixOrder,
  type MixOrder,
  type MixOrderTrack,
} from '../../../api/studio/sound-mix-order';
import { PageError, PageLoading } from '../../../components/PageStates';

type Props = {
  isOpen: boolean;
  tracks: MixOrderTrack[];
  onClose: () => void;
  /** Ordered ids (keyed tracks first, then the unplaced ones) to add to a playlist. */
  onUseOrder: (ids: string[]) => void;
};

/** Selected sounds in a DJ-style mix order (Camelot key, then BPM). */
export function SoundsMixOrderDialog({
  isOpen,
  tracks,
  onClose,
  onUseOrder,
}: Props) {
  const { t } = useTranslation('web');
  const [order, setOrder] = useState<MixOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let active = true;
    setOrder(null);
    setError(null);
    void suggestSoundMixOrder(tracks).then((result) => {
      if (!active) {
        return;
      }
      if (result.ok) {
        setOrder(result.data);
      } else {
        setError(result.error);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpen, tracks, attempt]);

  const detail = (track: MixOrderTrack & { camelot?: string }) =>
    [
      track.camelot,
      track.bpm
        ? t('library.mixOrderBpm', { bpm: Math.round(track.bpm) })
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <Dialog.Title>{t('library.mixOrderTitle')}</Dialog.Title>
      <Dialog.Description>
        {t('library.mixOrderDescription')}
      </Dialog.Description>
      <div className="mt-3 flex max-h-80 flex-col gap-3 overflow-y-auto">
        {error ? (
          <PageError
            title={t('library.mixOrderError')}
            description={error}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : order === null ? (
          <PageLoading label={t('library.mixOrderLoading')} />
        ) : (
          <>
            {order.items.length > 0 ? (
              <ol
                className="flex flex-col gap-1 text-sm"
                aria-label={t('library.mixOrderTitle')}
              >
                {order.items.map((track, index) => (
                  <li
                    key={track.id}
                    className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-1.5"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-foreground-secondary mr-2 tabular-nums">
                        {index + 1}.
                      </span>
                      {track.title}
                    </span>
                    <span className="text-foreground-secondary shrink-0 text-xs tabular-nums">
                      {detail(track)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-foreground-secondary text-sm">
                {t('library.mixOrderNoKeys')}
              </p>
            )}
            {order.unplaced.length > 0 ? (
              <div className="text-sm">
                <p className="text-foreground-secondary mb-1">
                  {t('library.mixOrderUnplaced', {
                    count: order.unplaced.length,
                  })}
                </p>
                <ul className="text-foreground-secondary flex flex-col gap-0.5">
                  {order.unplaced.map((track) => (
                    <li key={track.id} className="truncate">
                      {track.title}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="text" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          disabled={!order || order.items.length === 0}
          onClick={() => {
            if (order) {
              onUseOrder([
                ...order.items.map((track) => track.id),
                ...order.unplaced.map((track) => track.id),
              ]);
            }
          }}
        >
          {t('library.mixOrderUse')}
        </Button>
      </div>
    </Dialog.Root>
  );
}
