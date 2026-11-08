import { PlayIcon, Trash2Icon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, InlineError, Loader, Tooltip } from '@tahti-player/ui';

import type {
  NativePlayLogEntry,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { preparePlayables } from '../lib/nativePlayback';
import {
  latestSession,
  playedAtDate,
  SET_GAP_MINUTES,
} from '../lib/setTracklist';
import { usePlayerStore } from '../stores/playerStore';
import { ConfirmDialog } from './ConfirmDialog';
import { ListingDate } from './ListingDate';
import { PageEmpty, PageError } from './PageStates';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  library: TahtiNativeLibrary;
  onChanged: () => void;
};

/** Local listening history: every counted listen, newest first, kept on this device. */
export function PlayHistoryDialog({
  isOpen,
  onClose,
  library,
  onChanged,
}: Props) {
  const { t } = useTranslation('web');
  const [entries, setEntries] = useState<NativePlayLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const play = usePlayerStore((state) => state.play);
  const session = useMemo(() => latestSession(entries), [entries]);
  const sessionIds = useMemo(
    () =>
      session
        .map((entry) => entry.trackId)
        .filter((id): id is string => Boolean(id)),
    [session],
  );

  const load = useCallback(
    async (offset: number) => {
      setLoading(true);
      try {
        const page = await library.catalog.playHistory(offset);
        setEntries((current) =>
          offset === 0 ? page.entries : [...current, ...page.entries],
        );
        setTotal(page.total);
        setError(null);
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'Could not load history.',
        );
      } finally {
        setLoading(false);
      }
    },
    [library],
  );

  useEffect(() => {
    if (isOpen) {
      setEntries([]);
      void load(0);
    }
  }, [isOpen, load]);

  const resume = async () => {
    try {
      const playables = await preparePlayables(library, sessionIds, 'session');
      const [head, ...rest] = playables;
      if (!head) {
        toast.error(i18n.t('web:toasts.nonePlayable'));
        return;
      }
      play(head, { enqueueRest: rest });
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not play this session.',
      );
    }
  };

  const clear = async () => {
    try {
      await library.catalog.clearPlayHistory();
      toast.success(i18n.t('web:toasts.historyCleared'), {
        description: 'Play counts on tracks are unchanged.',
      });
      onChanged();
      await load(0);
    } catch (failure) {
      toast.error(
        failure instanceof Error ? failure.message : 'Could not clear history.',
      );
    }
  };

  return (
    <>
      <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-lg">
        <Dialog.Title>{t('playHistoryDialog.listeningHistory')}</Dialog.Title>
        <Dialog.Description>
          {t('playHistoryDialog.localFilesYouHaveListened')}
        </Dialog.Description>
        <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto py-2">
          {error && entries.length === 0 ? (
            <PageError
              title={t('loadErrors.couldNotLoadYourListeningHistory')}
              description={error}
              onRetry={() => void load(0)}
            />
          ) : entries.length === 0 && !loading ? (
            <PageEmpty title={t('empties.playHistoryNothing')} />
          ) : (
            <ul className="flex flex-col gap-1">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-baseline gap-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {entry.title}
                    {entry.artist ? ` — ${entry.artist}` : ''}
                  </span>
                  <span className="text-foreground-secondary shrink-0 text-xs">
                    <ListingDate
                      value={
                        playedAtDate(entry.playedAt)?.toISOString() ??
                        entry.playedAt
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          {error && entries.length > 0 ? (
            <InlineError textSize="xs">{error}</InlineError>
          ) : null}
          {loading ? (
            <Loader size="inline" shape="circle" />
          ) : entries.length < total ? (
            <Button
              size="sm"
              variant="text"
              onClick={() => void load(entries.length)}
            >
              Show more ({(total - entries.length).toLocaleString('en-US')}{' '}
              older)
            </Button>
          ) : null}
        </div>
        {session.length > 0 ? (
          <p className="text-foreground-secondary text-xs">
            Your last session is {session.length}{' '}
            {session.length === 1 ? 'track' : 'tracks'} with no break longer
            than {SET_GAP_MINUTES} minutes.
          </p>
        ) : null}
        <Dialog.Actions>
          <Tooltip content={t('playHistoryDialog.resume')} side="top">
            <Button
              size="icon"
              variant="text"
              aria-label={t('playHistoryDialog.resume')}
              disabled={sessionIds.length === 0}
              onClick={() => void resume()}
            >
              <PlayIcon size={16} aria-hidden />
            </Button>
          </Tooltip>
          <Tooltip content={t('playHistory.clearAria')} side="top">
            <Button
              size="icon"
              variant="text"
              intent="danger"
              aria-label={t('playHistory.clearAria')}
              disabled={total === 0}
              onClick={() => setConfirmClear(true)}
            >
              <Trash2Icon size={16} aria-hidden />
            </Button>
          </Tooltip>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={confirmClear}
        destructive
        title={t('playHistory.clearTitle')}
        description={t('playHistory.clearDescription')}
        confirmLabel={t('actions.clear')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void clear();
        }}
      />
    </>
  );
}
