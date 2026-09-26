import {
  FolderOpenIcon,
  LoaderCircleIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';

import { Alert, Button, Dialog, Input } from '@tahti-player/ui';

import type {
  NativeItunesImport,
  NativeItunesImportResult,
  NativeItunesPreview,
} from '../../lib/nativeLibrary';
import { useItunesImport } from './useItunesImport';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itunesImport: NativeItunesImport;
  /** Asks for a folder; `null` if cancelled. */
  pickFolder: () => Promise<string | null>;
  /** Called after the catalog changed, so the library list refreshes. */
  onImported: () => void;
};

const n = (value: number) => value.toLocaleString('en-US');

const plural = (count: number, word: string) =>
  `${n(count)} ${word}${count === 1 ? '' : 's'}`;

function Counts({ rows }: { rows: Array<[string, number]> }) {
  const shown = rows.filter(([, value]) => value > 0);
  if (!shown.length) {
    return null;
  }
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
      {shown.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-foreground-secondary">{label}</dt>
          <dd className="text-right tabular-nums">{n(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PathList({ title, paths }: { title: string; paths: string[] }) {
  if (!paths.length) {
    return null;
  }
  return (
    <div className="text-foreground-secondary flex flex-col gap-0.5 text-xs">
      <p>{title}</p>
      <ul className="flex flex-col gap-0.5">
        {paths.map((path) => (
          <li key={path} className="truncate" title={path}>
            {path}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewSummary({ preview }: { preview: NativeItunesPreview }) {
  const resolved = preview.tracksInCatalog + preview.tracksToImport;
  const unresolved =
    preview.tracksMissing + preview.tracksUnsupported + preview.tracksNotLocal;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm" role="status">
        {n(resolved)} of {plural(preview.tracks, 'track')} found
        {unresolved ? `, ${n(unresolved)} not resolved` : ''};{' '}
        {plural(preview.playlists, 'playlist')}.
      </p>
      <Counts
        rows={[
          ['Already in your library (will be linked)', preview.tracksInCatalog],
          ['On disk, will be imported', preview.tracksToImport],
          ['File not found', preview.tracksMissing],
          ['Format not supported', preview.tracksUnsupported],
          ['Not a local file (stream or cloud)', preview.tracksNotLocal],
          ['Duplicate entries for the same file', preview.duplicateTracks],
          ['Linked by an earlier import', preview.previouslyImported],
          ['Playlist entries', preview.playlistEntries],
          ['Playlist folders', preview.playlistFolders],
          ['Playlists imported before', preview.playlistsAlreadyImported],
        ]}
      />
      <PathList
        title="Not found, for example:"
        paths={preview.missingExamples}
      />
      <PathList
        title="Not supported, for example:"
        paths={preview.unsupportedExamples}
      />
    </div>
  );
}

function ResultSummary({
  result,
  preview,
}: {
  result: NativeItunesImportResult;
  preview: NativeItunesPreview | null;
}) {
  const unresolved =
    result.tracksMissing +
    result.tracksUnsupported +
    result.tracksNotLocal +
    result.tracksFailed;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm" role="status">
        {plural(result.tracksLinked + result.tracksImported, 'track')} linked or
        imported, {plural(result.playlistsCreated, 'playlist')} created
        {unresolved ? `; ${n(unresolved)} not resolved` : ''}.
      </p>
      <Counts
        rows={[
          ['Linked to tracks in your library', result.tracksLinked],
          ['Imported', result.tracksImported],
          ['Could not be imported', result.tracksFailed],
          ['File not found', result.tracksMissing],
          ['Format not supported', result.tracksUnsupported],
          ['Not a local file', result.tracksNotLocal],
          ['Plays added', result.playsAdded],
          ['Skips added', result.skipsAdded],
          ['Ratings applied', result.ratingsApplied],
          ['Loved tracks tagged', result.lovedTagged],
          ['Empty tags filled', result.fieldsFilled],
          ['Tags kept from the file', result.fieldsKeptFromFile],
          ['BPM values applied', result.bpmApplied],
          ['Playlists renamed (name taken)', result.playlistsRenamed],
          ['Playlists imported before', result.playlistsAlreadyImported],
          ['Playlist entries', result.playlistEntries],
          [
            'Playlist entries waiting for their file',
            result.playlistEntriesUnavailable,
          ],
          ['Playlist entries left out', result.playlistEntriesSkipped],
        ]}
      />
      {result.errors.length ? (
        <div className="flex flex-col gap-0.5 text-xs">
          <p className="text-foreground-secondary">Could not be imported:</p>
          <ul className="flex flex-col gap-0.5">
            {result.errors.map((failure) => (
              <li
                key={failure.path}
                className="truncate"
                title={`${failure.path}: ${failure.error}`}
              >
                <span className="text-destructive">{failure.error}</span>{' '}
                <span className="text-foreground-secondary">
                  {failure.path}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {preview ? (
        <>
          <PathList
            title="Not found, for example:"
            paths={result.tracksMissing ? preview.missingExamples : []}
          />
          <PathList
            title="Not supported, for example:"
            paths={result.tracksUnsupported ? preview.unsupportedExamples : []}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * Imports an iTunes / Music.app library export (`Library.xml`): links its
 * tracks to the catalog by path, imports files that are on disk but not in
 * the library, fills empty tags, adds ratings and play counts and recreates
 * playlists. Audio files are never touched. Folder remaps fix paths when the
 * music has moved since the export.
 */
export function ItunesImportDialog({
  isOpen,
  onClose,
  itunesImport,
  pickFolder,
  onImported,
}: Props) {
  const state = useItunesImport({
    isOpen,
    itunesImport,
    pickFolder,
    onImported,
  });
  const working = state.phase === 'previewing' || state.phase === 'committing';
  const reviewing = state.phase === 'review' || state.phase === 'previewing';
  const importable = state.preview
    ? state.preview.tracksInCatalog +
      state.preview.tracksToImport +
      state.preview.playlists
    : 0;

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => (state.phase === 'committing' ? undefined : onClose())}
      className="max-w-xl"
    >
      <Dialog.Title>Import iTunes library</Dialog.Title>
      <Dialog.Description>
        Brings in tracks, ratings, play counts and playlists from an iTunes or
        Music.app library export (File → Library → Export Library…). Your audio
        files are not changed, and tags already in a file are kept.
      </Dialog.Description>

      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      {state.phase === 'pick' ? (
        <div className="py-2">
          <Button onClick={() => void state.pickFile()}>
            <FolderOpenIcon size={14} aria-hidden />
            Choose library file…
          </Button>
        </div>
      ) : null}

      {state.sourcePath && state.phase !== 'pick' ? (
        <p
          className="text-foreground-secondary truncate text-xs"
          title={state.sourcePath}
        >
          {state.sourcePath}
        </p>
      ) : null}

      {state.phase === 'previewing' && !state.preview ? (
        <p className="text-foreground-secondary flex items-center gap-2 py-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Reading the library…
        </p>
      ) : null}

      {reviewing && state.preview ? (
        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto py-2">
          <PreviewSummary preview={state.preview} />
          <section className="flex flex-col gap-2" aria-label="Folder remaps">
            <p className="text-sm font-medium">Moved your music?</p>
            <p className="text-foreground-secondary text-xs">
              Replace the start of the paths in the export with where the files
              are now
              {state.preview.musicFolder
                ? ` (the export's music folder is ${state.preview.musicFolder})`
                : ''}
              .
            </p>
            {state.drafts.map((draft, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    size="sm"
                    label="Old folder"
                    value={draft.from}
                    onChange={(event) =>
                      state.updateMapping(index, { from: event.target.value })
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Input
                    size="sm"
                    label="New folder"
                    value={draft.to}
                    onChange={(event) =>
                      state.updateMapping(index, { to: event.target.value })
                    }
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Choose new folder ${index + 1}`}
                  onClick={() => void state.chooseTarget(index)}
                >
                  <FolderOpenIcon size={14} aria-hidden />
                </Button>
                <Button
                  size="sm"
                  variant="text"
                  aria-label={`Remove remap ${index + 1}`}
                  onClick={() => state.removeMapping(index)}
                >
                  <XIcon size={14} aria-hidden />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="text" onClick={state.addMapping}>
                <PlusIcon size={14} aria-hidden />
                Add folder remap
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!state.dirty || working}
                onClick={state.refresh}
              >
                {state.phase === 'previewing' ? (
                  <LoaderCircleIcon
                    size={14}
                    className="animate-spin"
                    aria-hidden
                  />
                ) : null}
                Preview again
              </Button>
            </div>
            {state.dirty ? (
              <Alert tone="warning" className="px-3 py-2 text-xs">
                Preview again to apply the folder changes before importing.
              </Alert>
            ) : null}
          </section>
        </div>
      ) : null}

      {state.phase === 'committing' ? (
        <p
          className="text-foreground-secondary flex items-center gap-2 py-2 text-sm"
          role="status"
        >
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Importing… Large libraries can take a few minutes.
        </p>
      ) : null}

      {state.phase === 'done' && state.result ? (
        <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto py-2">
          <ResultSummary result={state.result} preview={state.preview} />
        </div>
      ) : null}

      <Dialog.Actions>
        {state.phase === 'committing' ? null : (
          <Dialog.Close>
            {state.phase === 'done' ? 'Done' : 'Cancel'}
          </Dialog.Close>
        )}
        {reviewing ? (
          <Button
            variant="text"
            disabled={working}
            onClick={() => void state.pickFile()}
          >
            Choose another file
          </Button>
        ) : null}
        {reviewing || state.phase === 'committing' ? (
          <Button
            disabled={working || state.dirty || importable === 0}
            onClick={() => void state.commit()}
          >
            {state.phase === 'committing' ? (
              <LoaderCircleIcon
                size={14}
                className="animate-spin"
                aria-hidden
              />
            ) : null}
            Import
          </Button>
        ) : null}
      </Dialog.Actions>
    </Dialog.Root>
  );
}
