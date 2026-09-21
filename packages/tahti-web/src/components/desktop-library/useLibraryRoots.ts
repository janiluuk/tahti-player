import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type {
  NativeLibraryRoot,
  NativeRootScanResult,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { describeImportFailures } from './importFailures';
import { basename } from './pathLabels';

/**
 * Watched folders: the list, the watching toggle, and the add / rescan /
 * relink / remove actions. `refresh` reloads the whole library after a change;
 * `onBusyStart` lets the caller clear its import progress.
 */
export function useLibraryRoots(
  library: TahtiNativeLibrary | null,
  refresh: () => Promise<void>,
  onBusyStart: () => void,
) {
  const [roots, setRoots] = useState<NativeLibraryRoot[]>([]);
  const [watching, setWatching] = useState(true);
  const [rootBusy, setRootBusy] = useState<string | 'add' | 'rescan' | null>(
    null,
  );
  const [rootToRemove, setRootToRemove] = useState<NativeLibraryRoot | null>(
    null,
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    void library?.getWatching?.().then(setWatching, () => {});
  }, [library]);

  const changeWatching = async (enabled: boolean) => {
    if (!library?.setWatching) {
      return;
    }
    setWatching(enabled);
    try {
      await library.setWatching(enabled);
      toast.success(
        enabled
          ? 'Watching folders for changes.'
          : 'Folder watching paused — use Rescan to pick up changes.',
      );
    } catch (error) {
      setWatching(!enabled);
      toast.error(
        error instanceof Error ? error.message : 'Could not change watching.',
      );
    }
  };

  // The folder watcher reconciles roots on its own; refresh when it changed
  // something so the list never shows stale rows.
  useEffect(() => {
    if (!library?.onRootsChanged) {
      return;
    }
    return library.onRootsChanged((result) => {
      void refreshRef.current();
      describeRootScan(result);
    });
  }, [library]);

  const describeRootScan = (result: NativeRootScanResult) => {
    const parts = [
      result.imported ? `${result.imported} new` : null,
      result.recovered ? `${result.recovered} recovered` : null,
      result.moved ? `${result.moved} moved` : null,
      result.updated ? `${result.updated} updated` : null,
      result.missing ? `${result.missing} missing` : null,
    ].filter(Boolean);
    if (result.errors.length) {
      toast.error(
        result.errors.length === 1
          ? '1 file could not be scanned.'
          : `${result.errors.length} files could not be scanned.`,
        { description: describeImportFailures(result.errors) },
      );
    }
    if (result.cancelled) {
      toast.info('Scan cancelled.');
    } else if (parts.length) {
      toast.success(`Scan complete: ${parts.join(', ')}.`);
    } else if (!result.errors.length) {
      toast.success('Scan complete: nothing changed.');
    }
  };

  const runRootAction = async (
    busy: string,
    action: (library: NonNullable<TahtiNativeLibrary>) => Promise<void>,
    failure: string,
  ) => {
    if (!library) {
      return;
    }
    setRootBusy(busy);
    onBusyStart();
    try {
      await action(library);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failure);
    } finally {
      setRootBusy(null);
      onBusyStart();
    }
  };

  const addRoot = () =>
    runRootAction(
      'add',
      async (library) => {
        const result = await library.addRoot();
        if (result) {
          describeRootScan(result);
        }
      },
      'Could not add folder.',
    );

  const rescanRoots = () =>
    runRootAction(
      'rescan',
      async (library) => describeRootScan(await library.rescanRoots()),
      'Scan failed.',
    );

  const relinkRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        const result = await library.relinkRoot(root.id);
        if (result) {
          toast.success(
            result.unmatched
              ? `Relinked ${result.relinked} tracks; ${result.unmatched} not found in the new folder.`
              : `Relinked ${result.relinked} tracks.`,
          );
        }
      },
      'Relink failed.',
    );

  const removeRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        await library.removeRoot(root.id);
        toast.success(
          `Stopped tracking “${basename(root.path)}”. Its tracks stay in your library.`,
        );
      },
      'Could not remove folder.',
    );

  return {
    roots,
    setRoots,
    watching,
    rootBusy,
    rootToRemove,
    setRootToRemove,
    changeWatching,
    addRoot,
    rescanRoots,
    relinkRoot,
    removeRoot,
  };
}
