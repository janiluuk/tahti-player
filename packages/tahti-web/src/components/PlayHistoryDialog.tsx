import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  CopyButton,
  Dialog,
  InlineError,
  Loader,
} from '@tahti-player/ui';

import type {
  NativePlayLogEntry,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import {
  formatTracklist,
  latestSession,
  SET_GAP_MINUTES,
} from '../lib/setTracklist';
import { ConfirmDialog } from './ConfirmDialog';
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
  const [entries, setEntries] = useState<NativePlayLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const session = useMemo(() => latestSession(entries), [entries]);

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

  const clear = async () => {
    try {
      await library.catalog.clearPlayHistory();
      toast.success('Listening history cleared.', {
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
        <Dialog.Title>Listening history</Dialog.Title>
        <Dialog.Description>
          Local files you have listened to, newest first. Kept on this device
          only.
        </Dialog.Description>
        <div className="flex max-h-[50vh] flex-col gap-1 overflow-y-auto py-2">
          {error && entries.length === 0 ? (
            <PageError
              title="Could not load your listening history"
              description={error}
              onRetry={() => void load(0)}
            />
          ) : entries.length === 0 && !loading ? (
            <PageEmpty title="Nothing yet. A listen counts after 30 seconds of a local track." />
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
                    {entry.playedAt} UTC
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
            than {SET_GAP_MINUTES} minutes. Copy it as a numbered tracklist to
            post with a mix.
          </p>
        ) : null}
        <Dialog.Actions>
          {session.length > 0 ? (
            <CopyButton
              text={formatTracklist(session)}
              label="Copy last session"
              variant="text"
              toastMessage="Tracklist copied."
            />
          ) : null}
          <Button
            variant="text"
            intent="danger"
            disabled={total === 0}
            onClick={() => setConfirmClear(true)}
          >
            Clear history
          </Button>
          <Dialog.Close>Done</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>
      <ConfirmDialog
        isOpen={confirmClear}
        title="Clear the listening history?"
        description="The list of past listens is deleted. Each track keeps its play count and last-played date."
        confirmLabel="Clear"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          void clear();
        }}
      />
    </>
  );
}
