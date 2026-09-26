import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  NativeItunesImport,
  NativeItunesImportResult,
  NativeItunesPreview,
  NativeRootMapping,
} from '../../lib/nativeLibrary';

export type ItunesImportPhase =
  'pick' | 'previewing' | 'review' | 'committing' | 'done';

const message = (failure: unknown, fallback: string) =>
  failure instanceof Error ? failure.message : String(failure || fallback);

/** Rows with both sides filled, trimmed; half-typed rows are ignored. */
export function completeMappings(
  drafts: NativeRootMapping[],
): NativeRootMapping[] {
  return drafts
    .map((draft) => ({ from: draft.from.trim(), to: draft.to.trim() }))
    .filter((draft) => draft.from && draft.to);
}

const sameMappings = (a: NativeRootMapping[], b: NativeRootMapping[]) =>
  a.length === b.length &&
  a.every((mapping, index) => {
    const other = b[index];
    return other && mapping.from === other.from && mapping.to === other.to;
  });

type Options = {
  isOpen: boolean;
  itunesImport: NativeItunesImport;
  pickFolder: () => Promise<string | null>;
  onImported: () => void;
};

export function useItunesImport({
  isOpen,
  itunesImport,
  pickFolder,
  onImported,
}: Options) {
  const [phase, setPhase] = useState<ItunesImportPhase>('pick');
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<NativeRootMapping[]>([]);
  const [applied, setApplied] = useState<NativeRootMapping[]>([]);
  const [preview, setPreview] = useState<NativeItunesPreview | null>(null);
  const [result, setResult] = useState<NativeItunesImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A slower, older preview must not overwrite a newer one.
  const request = useRef(0);
  const hasPreview = useRef(false);
  hasPreview.current = preview !== null;

  useEffect(() => {
    if (isOpen) {
      request.current += 1;
      setPhase('pick');
      setSourcePath(null);
      setDrafts([]);
      setApplied([]);
      setPreview(null);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const runPreview = useCallback(
    async (path: string, mappings: NativeRootMapping[]) => {
      const id = ++request.current;
      setPhase('previewing');
      setError(null);
      try {
        const value = await itunesImport.preview(path, mappings);
        if (id !== request.current) {
          return;
        }
        setPreview(value);
        setApplied(mappings);
        setPhase('review');
      } catch (failure) {
        if (id !== request.current) {
          return;
        }
        setError(message(failure, 'Could not read the library file.'));
        setPhase(hasPreview.current ? 'review' : 'pick');
      }
    },
    [itunesImport],
  );

  const pickFile = useCallback(async () => {
    setError(null);
    try {
      const path = await itunesImport.pick();
      if (!path) {
        return;
      }
      setSourcePath(path);
      setPreview(null);
      await runPreview(path, completeMappings(drafts));
    } catch (failure) {
      setError(message(failure, 'Could not choose a file.'));
    }
  }, [itunesImport, runPreview, drafts]);

  const addMapping = useCallback(() => {
    setDrafts((current) => {
      const suggested = preview?.musicFolder ?? '';
      const taken = current.some((draft) => draft.from === suggested);
      return [...current, { from: taken ? '' : suggested, to: '' }];
    });
  }, [preview]);

  const updateMapping = useCallback(
    (index: number, patch: Partial<NativeRootMapping>) => {
      setDrafts((current) =>
        current.map((draft, at) =>
          at === index ? { ...draft, ...patch } : draft,
        ),
      );
    },
    [],
  );

  const removeMapping = useCallback((index: number) => {
    setDrafts((current) => current.filter((_, at) => at !== index));
  }, []);

  const chooseTarget = useCallback(
    async (index: number) => {
      try {
        const to = await pickFolder();
        if (to) {
          updateMapping(index, { to });
        }
      } catch (failure) {
        setError(message(failure, 'Could not choose a folder.'));
      }
    },
    [pickFolder, updateMapping],
  );

  const complete = completeMappings(drafts);
  const dirty = !sameMappings(complete, applied);

  const refresh = useCallback(() => {
    if (sourcePath) {
      void runPreview(sourcePath, completeMappings(drafts));
    }
  }, [sourcePath, drafts, runPreview]);

  const commit = useCallback(async () => {
    if (!sourcePath) {
      return;
    }
    setPhase('committing');
    setError(null);
    try {
      const value = await itunesImport.commit(sourcePath, applied);
      setResult(value);
      setPhase('done');
      onImported();
    } catch (failure) {
      setError(message(failure, 'Could not import the library.'));
      setPhase('review');
    }
  }, [itunesImport, sourcePath, applied, onImported]);

  return {
    phase,
    sourcePath,
    drafts,
    dirty,
    preview,
    result,
    error,
    pickFile,
    addMapping,
    updateMapping,
    removeMapping,
    chooseTarget,
    refresh,
    commit,
  };
}
