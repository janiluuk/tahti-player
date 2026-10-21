import { useState } from 'react';
import { toast } from 'sonner';

import type {
  NativeArtworkBackfill,
  NativeArtworkBackfillResult,
} from '../../lib/nativeLibrary';

const TOAST_ID = 'library-artwork-backfill';

const tracks = (count: number) =>
  `${count.toLocaleString('en-US')} track${count === 1 ? '' : 's'}`;

function report(result: NativeArtworkBackfillResult) {
  const withoutArt = result.checked - result.found - result.cacheFull;
  const details = [
    withoutArt > 0 ? `${tracks(withoutArt)} have no embedded picture.` : '',
    result.cacheFull > 0
      ? `${tracks(result.cacheFull)} skipped because the artwork cache is full.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  const description = details || undefined;
  if (result.cancelled) {
    toast.info(`Stopped. Found artwork for ${tracks(result.found)}.`, {
      id: TOAST_ID,
      description,
    });
  } else if (result.checked === 0) {
    toast.success('No tracks are missing artwork.', { id: TOAST_ID });
  } else {
    toast.success(`Found artwork for ${tracks(result.found)}.`, {
      id: TOAST_ID,
      description,
    });
  }
}

/**
 * Runs the native "find missing artwork" job with a progress toast that can
 * cancel it; `onChanged` refreshes the table so new covers show up.
 */
export function useArtworkBackfill(
  backfill: NativeArtworkBackfill | undefined,
  onChanged: () => void,
) {
  const [running, setRunning] = useState(false);

  const start = async () => {
    if (!backfill || running) {
      return;
    }
    setRunning(true);
    const cancel = {
      label: 'Cancel',
      onClick: (event: { preventDefault: () => void }) => {
        event.preventDefault();
        void backfill.cancel();
      },
    };
    toast.loading('Looking for missing artwork…', {
      id: TOAST_ID,
      action: cancel,
    });
    const unsubscribe = backfill.onProgress(({ done, total }) => {
      toast.loading(
        `Looking for missing artwork… ${done.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}`,
        { id: TOAST_ID, action: cancel },
      );
    });
    try {
      report(await backfill.start());
      onChanged();
    } catch (failure) {
      toast.error(
        failure instanceof Error
          ? failure.message
          : 'Could not look for missing artwork.',
        { id: TOAST_ID },
      );
    } finally {
      unsubscribe();
      setRunning(false);
    }
  };

  return { available: Boolean(backfill), running, start };
}
