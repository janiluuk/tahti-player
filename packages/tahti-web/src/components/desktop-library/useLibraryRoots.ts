import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { i18n } from '@tahti-player/i18n';

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
          ? i18n.t('web:libraryRootsStates.watching')
          : i18n.t('web:libraryRootsStates.watchingPaused'),
      );
    } catch (error) {
      setWatching(!enabled);
      toast.error(
        error instanceof Error
          ? error.message
          : i18n.t('web:libraryRootsStates.couldNotChangeWatching'),
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
      toast.info(i18n.t('web:toasts.scanCancelled'));
    } else if (parts.length) {
      toast.success(
        i18n.t('web:toasts.scanCompleteParts', { parts: parts.join(', ') }),
      );
    } else if (!result.errors.length) {
      toast.success(i18n.t('web:toasts.scanCompleteNothingChanged'));
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
      i18n.t('web:libraryRootsStates.couldNotAddFolder'),
    );

  const rescanRoots = () =>
    runRootAction(
      'rescan',
      async (library) => describeRootScan(await library.rescanRoots()),
      i18n.t('web:libraryRootsStates.scanFailed'),
    );

  const relinkRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        const result = await library.relinkRoot(root.id);
        if (result) {
          toast.success(
            result.unmatched
              ? i18n.t('web:libraryRootsStates.relinkedPartial', {
                  count: result.relinked,
                  unmatched: result.unmatched,
                })
              : i18n.t('web:libraryRootsStates.relinked', {
                  count: result.relinked,
                }),
          );
        }
      },
      i18n.t('web:libraryRootsStates.relinkFailed'),
    );

  const removeRoot = (root: NativeLibraryRoot) =>
    runRootAction(
      root.id,
      async (library) => {
        await library.removeRoot(root.id);
        toast.success(
          i18n.t('web:libraryRootsStates.stoppedTracking', {
            folder: basename(root.path),
          }),
        );
      },
      i18n.t('web:libraryRootsStates.couldNotRemoveFolder'),
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
