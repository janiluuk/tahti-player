import { useTranslation, type TFunction } from '@tahti-player/i18n';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  InlineError,
  InlineLoader,
  Input,
  Loader,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type { NativeProviderImport } from '../../lib/nativeLibrary';
import { formatBytes } from '../../lib/storageFormat';
import type { SetImportSource } from './setImportSources';
import {
  useProviderSetImport,
  type SetImportRow,
  type SetImportSpace,
} from './useProviderSetImport';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Which provider the set comes from, e.g. `hearthisSetSource`. */
  source: SetImportSource;
  providerImport: NativeProviderImport;
  /** Called after tracks were added, so the library list refreshes. */
  onImported: () => void;
};

const formatCount = (count: number) => count.toLocaleString('en-US');

function formatDuration(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.round((totalSec % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function rowStatus(row: SetImportRow, t: TFunction<'web'>): string {
  switch (row.state) {
    case 'ready':
      return '';
    case 'unavailable':
      return t('providerSetImportDialogBatch30.notOfferedForDownload');
    case 'waiting':
      return t('providerSetImportDialogBatch30.waiting');
    case 'downloading':
      return row.percent === null
        ? t('providerSetImportDialogBatch30.downloading')
        : t('providerSetImportDialogBatch30.downloadingPercent', {
            percent: row.percent,
          });
    case 'imported':
      return t('providerSetImportDialogBatch30.imported');
    case 'skipped':
      return t('providerSetImportDialogBatch30.alreadyInLibrary');
    case 'failed':
      return row.error
        ? t('providerSetImportDialogBatch30.failedError', { error: row.error })
        : t('providerSetImport.failed');
    case 'cancelled':
      return t('providerSetImportDialogBatch30.cancelled');
  }
}

function spaceSummary(
  space: SetImportSpace & { status: 'ready' },
  t: TFunction<'web'>,
): string {
  const { neededBytes, sized, unknownSize, freeBytes } = space.value;
  if (sized + unknownSize === 0) {
    return t('providerSetImportDialogBatch30.everyTrackInLibrary');
  }
  const needed =
    sized === 0
      ? t('providerSetImportDialogBatch30.fileSizesNotListed')
      : t('providerSetImportDialogBatch30.aboutNeeded', {
          size: formatBytes(neededBytes),
        }) +
        (unknownSize
          ? t('providerSetImportDialogBatch30.unknownSizeSuffix', {
              count: unknownSize,
              n: formatCount(unknownSize),
            })
          : '');
  const free =
    freeBytes === null
      ? t('providerSetImportDialogBatch30.freeSpaceUnknown')
      : t('providerSetImportDialogBatch30.freeOnDisk', {
          size: formatBytes(freeBytes),
        });
  return t('providerSetImportDialogBatch30.neededAndFree', { needed, free });
}

function SpaceLine({
  space,
  onRecheck,
}: {
  space: SetImportSpace;
  onRecheck: () => void;
}) {
  const { t } = useTranslation('web');
  if (space.status === 'idle') {
    return null;
  }
  if (space.status === 'checking') {
    return (
      <p className="text-foreground-secondary flex items-center gap-2 text-xs">
        <Loader size="xs" shape="circle" />
        {t('providerSetImport.checkingFileSizes')}
      </p>
    );
  }
  if (space.status === 'failed') {
    return (
      <p className="text-foreground-secondary text-xs">
        {t('providerSetImportDialogBatch30.couldNotCheckSizes', {
          error: space.error,
        })}
      </p>
    );
  }
  const { verdict, neededBytes, freeBytes } = space.value;
  return (
    <div className="flex flex-col gap-1 text-xs">
      <p className="text-foreground-secondary">{spaceSummary(space, t)}</p>
      {verdict === 'tight' ? (
        <Alert tone="warning" className="px-3 py-2 text-xs">
          {t('providerSetImport.theSetFitsButLeaves')}
        </Alert>
      ) : null}
      {verdict === 'notEnough' ? (
        <Alert tone="error" className="px-3 py-2 text-xs">
          <span className="flex items-center justify-between gap-2">
            <span>
              {t('providerSetImportDialogBatch30.notEnoughSpace', {
                size: formatBytes(neededBytes - (freeBytes ?? 0)),
              })}
            </span>
            <Button variant="text" size="xs" onClick={onRecheck}>
              {t('providerSetImport.checkAgain')}
            </Button>
          </span>
        </Alert>
      ) : null}
    </div>
  );
}

function TrackRows({ rows }: { rows: SetImportRow[] }) {
  const { t } = useTranslation('web');
  return (
    <ol
      className="border-border flex max-h-[40vh] flex-col overflow-y-auto rounded-md border text-sm"
      aria-label={t('providerSetImport.tracksInTheSet')}
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
          <Tooltip
            content={row.track.title}
            side="top"
            wrapperClassName="min-w-0 flex-1"
          >
            <span
              className={`min-w-0 flex-1 truncate ${row.state === 'unavailable' ? 'text-foreground-secondary' : ''}`}
            >
              {row.track.title}
            </span>
          </Tooltip>
          {row.state === 'failed' ? (
            <Badge variant="pill" color="red">
              {t('providerSetImport.failed')}
            </Badge>
          ) : null}
          <span
            className={`shrink-0 text-xs ${row.state === 'failed' ? 'text-accent-red-strong max-w-[45%] truncate' : 'text-foreground-secondary'}`}
            title={row.error ?? undefined}
          >
            {row.state === 'failed' ? row.error : rowStatus(row, t)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Downloads a provider set (hearthis.at, SoundCloud) into the desktop
 * library. Only tracks the uploader offers for download are fetched; streams
 * are never saved. Each finished file becomes a normal library track, and the
 * set can land in a playlist in its original order.
 */
export function ProviderSetImportDialog({
  isOpen,
  onClose,
  source,
  providerImport,
  onImported,
}: Props) {
  const { t } = useTranslation('web');
  const state = useProviderSetImport({
    isOpen,
    source,
    providerImport,
    onImported,
  });
  const running = state.phase === 'running';
  const notEnoughSpace =
    state.space.status === 'ready' && state.space.value.verdict === 'notEnough';
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
      <Dialog.Title>
        {t('providerSetImportDialogBatch30.title', { provider: source.label })}
      </Dialog.Title>
      <Dialog.Description>
        {t('providerSetImport.downloadsTheTracksTheUploader')}
      </Dialog.Description>

      {state.error ? <InlineError>{state.error}</InlineError> : null}

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
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                label={t('providerSetImport.setLink')}
                placeholder={source.linkPlaceholder}
                value={state.link}
                onChange={(event) => state.setLink(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={!state.link.trim()}>
              {t('providerSetImport.loadSet')}
            </Button>
          </form>
          {state.yourSets.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-foreground-secondary text-xs font-medium">
                {t('providerSetImport.yourSets')}
              </p>
              {state.yourSets.map((set) => (
                <Button
                  key={set.id}
                  variant="text"
                  size="flexible"
                  className="justify-between px-2 py-1.5 text-left"
                  onClick={() => state.loadSet(set)}
                >
                  <span className="truncate">{set.title}</span>
                  <span className="text-foreground-secondary shrink-0 text-xs">
                    {t('providerSetImportDialogBatch30.trackCount', {
                      count: set.trackCount,
                      n: formatCount(set.trackCount),
                    })}
                  </span>
                </Button>
              ))}
            </div>
          ) : null}
          {state.yourSetsError ? (
            <p className="text-foreground-secondary text-xs">
              {t('providerSetImportDialogBatch30.couldNotListSets', {
                provider: source.label,
                error: state.yourSetsError,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {state.phase === 'loading' ? (
        <InlineLoader
          label={t('providerSetImport.loadingTheSet')}
          className="py-2"
        />
      ) : null}

      {state.phase === 'review' ||
      state.phase === 'running' ||
      state.phase === 'done' ? (
        <div className="flex flex-col gap-3 py-2">
          {state.phase === 'review' ? (
            <>
              <Input
                label={t('providerSetImport.playlistAndFolderName')}
                value={state.title}
                onChange={(event) => state.setTitle(event.target.value)}
              />
              <p className="text-foreground-secondary text-xs break-all">
                {t('providerSetImportDialogBatch30.savesTo', {
                  destination: state.destination || '…',
                })}
              </p>
              <SpaceLine space={state.space} onRecheck={state.recheckSpace} />
            </>
          ) : null}
          <p role="status" className="text-sm">
            {state.phase === 'done' && state.result
              ? [
                  t('providerSetImportDialogBatch30.tracksImported', {
                    count: state.result.imported,
                    n: formatCount(state.result.imported),
                  }),
                  state.result.skipped
                    ? t('providerSetImportDialogBatch30.skippedInLibrary', {
                        n: state.result.skipped,
                      })
                    : '',
                  state.result.failures.length
                    ? t('providerSetImportDialogBatch30.failedCount', {
                        n: state.result.failures.length,
                      })
                    : '',
                  state.result.cancelled
                    ? t('providerSetImportDialogBatch30.stoppedEarly')
                    : '',
                ]
                  .filter(Boolean)
                  .join(', ') + '.'
              : t('providerSetImportDialogBatch30.canBeDownloaded', {
                  count: state.rows.length,
                  downloadable: state.downloadable,
                  n: formatCount(state.rows.length),
                  duration: formatDuration(totalSec),
                }) +
                (unavailable
                  ? t('providerSetImportDialogBatch30.notOfferedSuffix', {
                      count: unavailable,
                    })
                  : '')}
          </p>
          <TrackRows rows={state.rows} />
          {state.phase === 'review' ? (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span aria-hidden>{t('providerSetImport.addTheSetToA')}</span>
              <Toggle
                label={t('providerSetImport.addTheSetToA')}
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
            {t('providerSetImport.cancelDownload')}
          </Button>
        ) : (
          <Dialog.Close>
            {state.phase === 'done'
              ? t('providerSetImportDialogStates.done')
              : t('providerSetImportDialogStates.cancel')}
          </Dialog.Close>
        )}
        {state.phase === 'review' ? (
          <>
            <Button variant="text" onClick={state.back}>
              {t('providerSetImport.back')}
            </Button>
            <Button
              disabled={
                state.downloadable === 0 || !state.destination || notEnoughSpace
              }
              onClick={state.start}
            >
              {t('providerSetImportDialogBatch30.downloadTracks', {
                count: state.downloadable,
                n: formatCount(state.downloadable),
              })}
            </Button>
          </>
        ) : null}
        {state.phase === 'running' ? (
          <Button className="gap-1.5" disabled>
            <Loader size="inline" shape="circle" />
            {t('providerSetImport.downloading')}
          </Button>
        ) : null}
        {state.phase === 'done' && state.failedCount > 0 ? (
          <Button onClick={state.retryFailed}>
            {t('providerSetImportDialogBatch30.retryTracks', {
              count: state.failedCount,
              n: formatCount(state.failedCount),
            })}
          </Button>
        ) : null}
      </Dialog.Actions>
    </Dialog.Root>
  );
}
