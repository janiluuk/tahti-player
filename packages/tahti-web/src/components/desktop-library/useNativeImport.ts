import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type {
  NativeLibraryImportProgress,
  NativeLibraryImportResult,
  TahtiNativeLibrary,
} from '../../lib/nativeLibrary';
import { describeImportFailures } from './importFailures';

// The panel remounts on every visit to the library; offer an interrupted
// import from an earlier session once per app run, not on each visit.
let pendingImportOffered = false;

export function resetPendingImportOfferForTests() {
  pendingImportOffered = false;
}

/**
 * Importing files and folders (picker, drag-and-drop, retry of failures) with
 * live progress and cancellation. `refresh` reloads the library afterwards.
 */
export function useNativeImport(
  library: TahtiNativeLibrary | null,
  setLoading: (loading: boolean) => void,
  refresh: () => Promise<void>,
) {
  const [progress, setProgress] = useState<NativeLibraryImportProgress | null>(
    null,
  );
  const lastFailedPathsRef = useRef<string[]>([]);
  // Callers pass a fresh `refresh` every render; going through a ref keeps
  // `runImport` (and the drop subscription and the toast's Retry button)
  // stable instead of resubscribing on every search keystroke.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!library) {
      return;
    }
    return library.onImportProgress((next) => {
      setProgress(next.currentPath === null ? null : next);
    });
  }, [library]);

  const runImportRef = useRef<
    (
      action: (lib: TahtiNativeLibrary) => Promise<NativeLibraryImportResult>,
    ) => Promise<void>
  >(() => Promise.resolve());

  const reportImportResult = (result: NativeLibraryImportResult) => {
    lastFailedPathsRef.current = result.errors.map((failure) => failure.path);
    if (result.imported > 0) {
      toast.success(
        result.imported === 1
          ? 'Imported 1 track.'
          : `Imported ${result.imported} tracks.`,
      );
    }
    if (result.errors.length) {
      toast.error(
        result.errors.length === 1
          ? '1 file could not be imported.'
          : `${result.errors.length} files could not be imported.`,
        {
          description: describeImportFailures(result.errors),
          action: {
            label: 'Retry',
            onClick: () => void retry(),
          },
        },
      );
    }
    if (result.cancelled) {
      toast.info(
        'Import cancelled.',
        library?.resumeImport
          ? {
              description: 'Files already imported are kept.',
              action: { label: 'Resume', onClick: () => void resume() },
            }
          : undefined,
      );
    }
    if (
      !result.imported &&
      !result.errors.length &&
      !result.cancelled &&
      result.skipped
    ) {
      toast.info(
        result.skipped === 1
          ? '1 file was not a supported audio format.'
          : `${result.skipped} files were not a supported audio format.`,
      );
    }
  };

  const runImport = useCallback(
    async (
      action: (lib: TahtiNativeLibrary) => Promise<NativeLibraryImportResult>,
    ) => {
      if (!library) {
        return;
      }
      setLoading(true);
      setProgress(null);
      try {
        reportImportResult(await action(library));
        await refreshRef.current();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Import failed.');
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [library, setLoading],
  );
  runImportRef.current = runImport;

  const resume = useCallback(
    () =>
      runImportRef.current((lib) =>
        lib.resumeImport
          ? lib.resumeImport()
          : Promise.resolve({
              imported: 0,
              skipped: 0,
              errors: [],
              cancelled: false,
            }),
      ),
    [],
  );

  useEffect(() => {
    if (
      !library?.pendingImport ||
      !library.resumeImport ||
      pendingImportOffered
    ) {
      return;
    }
    let active = true;
    library
      .pendingImport()
      .then((pending) => {
        if (!active || !pending || pendingImportOffered) {
          return;
        }
        pendingImportOffered = true;
        toast.info(
          pending.files === 1
            ? 'An import was interrupted with 1 file left.'
            : `An import was interrupted with ${pending.files} files left.`,
          {
            duration: Infinity,
            action: { label: 'Resume', onClick: () => void resume() },
            cancel: {
              label: 'Discard',
              onClick: () => void library.discardPendingImport?.(),
            },
          },
        );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [library, resume]);

  const retry = () => {
    const paths = lastFailedPathsRef.current;
    return paths.length
      ? runImportRef.current((lib) => lib.importPaths(paths))
      : Promise.resolve();
  };

  useEffect(() => {
    if (!library) {
      return;
    }
    return library.onFilesDropped((paths) => {
      void runImport((lib) => lib.importPaths(paths));
    });
  }, [library, runImport]);

  return {
    progress,
    clearProgress: () => setProgress(null),
    importFiles: () => runImport((lib) => lib.import()),
    importFolder: () => runImport((lib) => lib.importFolder()),
    cancel: () => {
      void library?.cancelImport();
    },
  };
}
