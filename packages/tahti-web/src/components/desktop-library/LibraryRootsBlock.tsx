import {
  FolderPlusIcon,
  Link2Icon,
  LoaderCircleIcon,
  RefreshCwIcon,
  TrashIcon,
} from 'lucide-react';

import { Button, Toggle, Tooltip } from '@tahti-player/ui';

import type { NativeLibraryRoot } from '../../lib/nativeLibrary';
import { basename } from './pathLabels';

type Props = {
  roots: NativeLibraryRoot[];
  /** Whether the desktop runtime can pause folder watching at all. */
  canToggleWatching: boolean;
  watching: boolean;
  /** `'add'`, `'rescan'` or a root id while that action runs. */
  rootBusy: string | null;
  loading: boolean;
  onAdd: () => void;
  onRescan: () => void;
  onRelink: (root: NativeLibraryRoot) => void;
  onStopWatching: (root: NativeLibraryRoot) => void;
  onChangeWatching: (enabled: boolean) => void;
};

/** The "Watched folders" block: add, rescan, relink and stop watching. */
export function LibraryRootsBlock({
  roots,
  canToggleWatching,
  watching,
  rootBusy,
  loading,
  onAdd,
  onRescan,
  onRelink,
  onStopWatching,
  onChangeWatching,
}: Props) {
  return (
    <div
      className="border-border flex flex-col gap-1.5 rounded-md border p-2"
      data-testid="library-roots"
    >
      <div className="flex items-center gap-1">
        <p className="flex-1 text-xs font-semibold">Watched folders</p>
        <Button
          size="sm"
          variant="text"
          onClick={() => onAdd()}
          disabled={loading || rootBusy !== null}
        >
          {rootBusy === 'add' ? (
            <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
          ) : (
            <FolderPlusIcon size={14} aria-hidden />
          )}
          Add folder
        </Button>
        {roots.length > 0 && canToggleWatching ? (
          <Toggle
            label="Watch folders for changes"
            checked={watching}
            onChange={(enabled) => onChangeWatching(enabled)}
          />
        ) : null}
        {roots.length > 0 ? (
          <Button
            size="sm"
            variant="text"
            onClick={() => onRescan()}
            disabled={loading || rootBusy !== null}
          >
            {rootBusy === 'rescan' ? (
              <LoaderCircleIcon
                size={14}
                className="animate-spin"
                aria-hidden
              />
            ) : (
              <RefreshCwIcon size={14} aria-hidden />
            )}
            Rescan
          </Button>
        ) : null}
      </div>
      {roots.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          Add a folder to keep it in sync — new files are picked up on rescan
          and moved drives can be relinked in one step.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {roots.map((root) => (
            <li key={root.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1" title={root.path}>
                <p className="truncate text-xs font-semibold">
                  {basename(root.path)}
                </p>
                <p
                  className={
                    root.available
                      ? 'text-foreground-secondary truncate text-[10px]'
                      : 'text-destructive truncate text-[10px]'
                  }
                >
                  {root.available
                    ? `${root.trackCount} tracks${
                        root.missingCount
                          ? ` · ${root.missingCount} missing`
                          : ''
                      }`
                    : 'Folder not found — reconnect the drive or relink'}
                </p>
              </div>
              <Tooltip content="Relink to another folder" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label={`Relink ${basename(root.path)}`}
                  onClick={() => onRelink(root)}
                  disabled={loading || rootBusy !== null}
                >
                  {rootBusy === root.id ? (
                    <LoaderCircleIcon
                      size={14}
                      className="animate-spin"
                      aria-hidden
                    />
                  ) : (
                    <Link2Icon size={14} aria-hidden />
                  )}
                </Button>
              </Tooltip>
              <Tooltip content="Stop watching" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  intent="danger"
                  aria-label={`Stop watching ${basename(root.path)}`}
                  onClick={() => onStopWatching(root)}
                  disabled={rootBusy !== null}
                >
                  <TrashIcon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
