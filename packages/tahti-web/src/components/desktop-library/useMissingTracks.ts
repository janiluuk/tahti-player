import { useState } from 'react';
import { toast } from 'sonner';

import type {
  NativeLibraryTrack,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';

/**
 * Tracks whose files have gone missing: the list, "check missing files"
 * (rescan) and locating one by hand (relink). `setBusy` marks the long
 * action so the toolbar can disable itself; `refresh` reloads the library.
 */
export function useMissingTracks(
  library: TahtiNativeLibrary | null,
  setBusy: (busy: boolean) => void,
  refresh: () => Promise<void>,
) {
  const [unavailable, setUnavailable] = useState<NativeLibraryTrack[]>([]);

  const rescan = async () => {
    if (!library) {
      return;
    }
    setBusy(true);
    try {
      const missing = await library.rescan();
      setUnavailable(missing);
      await refresh();
      if (missing.length === 0) {
        toast.success('All library files are available.');
      } else {
        toast.info(
          missing.length === 1
            ? '1 library file is still missing.'
            : `${missing.length} library files are still missing.`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Re-scan failed.');
    } finally {
      setBusy(false);
    }
  };

  const relink = async (track: NativeLibraryTrack) => {
    if (!library) {
      return;
    }
    setBusy(true);
    try {
      const replacement = await library.relink(track.id);
      if (!replacement) {
        return;
      }
      await refresh();
      toast.success(`Located “${replacement.title}”.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Relink failed.');
    } finally {
      setBusy(false);
    }
  };

  return { unavailable, setUnavailable, rescan, relink };
}
