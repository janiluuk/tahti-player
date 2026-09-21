import { LoaderCircleIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button, Dialog } from '@tahti-player/ui';

import type {
  NativePlayLogEntry,
  TahtiNativeLibrary,
} from '../lib/nativeLibrary';
import { ConfirmDialog } from './ConfirmDialog';

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
          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : entries.length === 0 && !loading ? (
            <p className="text-muted-foreground text-sm">
              Nothing yet. A listen counts after 30 seconds of a local track.
            </p>
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
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {entry.playedAt} UTC
                  </span>
                </li>
              ))}
            </ul>
          )}
          {loading ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
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
        <Dialog.Actions>
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
