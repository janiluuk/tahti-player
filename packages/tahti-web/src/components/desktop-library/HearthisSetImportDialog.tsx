import { LoaderCircleIcon } from 'lucide-react';

import { Badge, Button, Dialog, Input, Toggle } from '@tahti-player/ui';

import type { NativeProviderImport } from '../../lib/nativeLibrary';
import {
  useHearthisSetImport,
  type SetImportRow,
} from './useHearthisSetImport';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  providerImport: NativeProviderImport;
  /** Called after tracks were added, so the library list refreshes. */
  onImported: () => void;
};

const plural = (count: number, word: string) =>
  `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`;

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function rowStatus(row: SetImportRow): string {
  switch (row.state) {
    case 'ready':
      return '';
    case 'unavailable':
      return 'Not offered for download';
    case 'waiting':
      return 'Waiting';
    case 'downloading':
      return row.percent === null
        ? 'Downloading'
        : `Downloading ${row.percent}%`;
    case 'imported':
      return 'Imported';
    case 'skipped':
      return 'Already in your library';
    case 'failed':
      return row.error ? `Failed: ${row.error}` : 'Failed';
    case 'cancelled':
      return 'Cancelled';
  }
}

function TrackRows({ rows }: { rows: SetImportRow[] }) {
  return (
    <ol
      className="border-border flex max-h-[40vh] flex-col overflow-y-auto rounded-md border text-sm"
      aria-label="Tracks in the set"
    >
      {rows.map((row, index) => (
        <li
          key={row.track.id}
          className="border-border flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
          data-state={row.state}
        >
          <span className="text-foreground-secondary w-6 shrink-0 text-right text-xs tabular-nums">
            {index + 1}
          </span>
          <span
            className={`min-w-0 flex-1 truncate ${row.state === 'unavailable' ? 'text-foreground-secondary' : ''}`}
            title={row.track.title}
          >
            {row.track.title}
          </span>
          {row.state === 'failed' ? (
            <Badge variant="pill" color="red">
              Failed
            </Badge>
          ) : null}
          <span
            className={`shrink-0 text-xs ${row.state === 'failed' ? 'text-destructive max-w-[45%] truncate' : 'text-foreground-secondary'}`}
            title={row.error ?? undefined}
          >
            {row.state === 'failed' ? row.error : rowStatus(row)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Downloads a hearthis.at set into the desktop library. Only tracks the
 * uploader offers for download are fetched; streams are never saved. Each
 * finished file becomes a normal library track, and the set can land in a
 * playlist in its original order.
 */
export function HearthisSetImportDialog({
  isOpen,
  onClose,
  providerImport,
  onImported,
}: Props) {
  const state = useHearthisSetImport({ isOpen, providerImport, onImported });
  const running = state.phase === 'running';
  const unavailable = state.rows.length - state.downloadable;
  const totalSec = state.rows
    .filter((row) => row.track.download)
    .reduce((sum, row) => sum + row.track.durationSec, 0);

  return (
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => (running ? undefined : onClose())}
      className="max-w-xl"
    >
      <Dialog.Title>Import a hearthis.at set</Dialog.Title>
      <Dialog.Description>
        Downloads the tracks the uploader offers for download and adds them to
        your library as local files. Tracks that are only streamable are left
        out.
      </Dialog.Description>

      {state.error ? (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      ) : null}

      {state.phase === 'pick' ? (
        <div className="flex flex-col gap-3 py-2">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              state.loadLink();
            }}
          >
            <div className="min-w-0 flex-1">
              <Input
                label="Set link"
                placeholder="https://hearthis.at/set/…"
                value={state.link}
                onChange={(event) => state.setLink(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={!state.link.trim()}>
              Load set
            </Button>
          </form>
          {state.yourSets.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-foreground-secondary text-xs font-medium">
                Your sets
              </p>
              {state.yourSets.map((set) => (
                <Button
                  key={set.id}
                  variant="text"
                  size="flexible"
                  className="justify-between px-2 py-1.5 text-left"
                  onClick={() => void state.loadSet(set.permalink, set.title)}
                >
                  <span className="truncate">{set.title}</span>
                  <span className="text-foreground-secondary shrink-0 text-xs">
                    {plural(set.trackCount, 'track')}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.phase === 'loading' ? (
        <p className="text-foreground-secondary flex items-center gap-2 py-2 text-sm">
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          Loading the set…
        </p>
      ) : null}

      {state.phase === 'review' ||
      state.phase === 'running' ||
      state.phase === 'done' ? (
        <div className="flex flex-col gap-3 py-2">
          {state.phase === 'review' ? (
            <>
              <Input
                label="Playlist and folder name"
                value={state.title}
                onChange={(event) => state.setTitle(event.target.value)}
              />
              <p className="text-foreground-secondary text-xs break-all">
                Saves to {state.destination || '…'}. A file that already exists
                there under the same name is kept and the new one gets a number.
              </p>
            </>
          ) : null}
          <p role="status" className="text-sm">
            {state.phase === 'done' && state.result
              ? [
                  `${plural(state.result.imported, 'track')} imported`,
                  state.result.skipped
                    ? `${state.result.skipped} already in your library`
                    : '',
                  state.result.failures.length
                    ? `${state.result.failures.length} failed`
                    : '',
                  state.result.cancelled ? 'stopped early' : '',
                ]
                  .filter(Boolean)
                  .join(', ') + '.'
              : `${state.downloadable} of ${plural(state.rows.length, 'track')} can be downloaded (${formatDuration(totalSec)}).` +
                (unavailable
                  ? ` ${unavailable} ${unavailable === 1 ? 'is' : 'are'} not offered for download.`
                  : '')}
          </p>
          <TrackRows rows={state.rows} />
          {state.phase === 'review' ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span aria-hidden>
                Add the set to a playlist in its original order
              </span>
              <Toggle
                label="Add the set to a playlist in its original order"
                checked={state.makePlaylist}
                onChange={state.setMakePlaylist}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog.Actions>
        {state.phase === 'running' ? (
          <Button variant="text" intent="danger" onClick={state.cancel}>
            Cancel download
          </Button>
        ) : (
          <Dialog.Close>
            {state.phase === 'done' ? 'Done' : 'Cancel'}
          </Dialog.Close>
        )}
        {state.phase === 'review' ? (
          <>
            <Button variant="text" onClick={state.back}>
              Back
            </Button>
            <Button
              disabled={state.downloadable === 0 || !state.destination}
              onClick={state.start}
            >
              Download {plural(state.downloadable, 'track')}
            </Button>
          </>
        ) : null}
        {state.phase === 'running' ? (
          <Button disabled>
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
            Downloading…
          </Button>
        ) : null}
        {state.phase === 'done' && state.failedCount > 0 ? (
          <Button onClick={state.retryFailed}>
            Retry {plural(state.failedCount, 'track')}
          </Button>
        ) : null}
      </Dialog.Actions>
    </Dialog.Root>
  );
}
