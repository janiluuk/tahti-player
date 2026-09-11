import { LibraryIcon, PlayIcon, TrashIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  EmptyState,
  FilePicker,
  Input,
  Tooltip,
} from '@tahti-player/ui';

import { hasNativePlayer } from '../lib/nativeCapabilities';
import {
  getNativeLibrary,
  playableFromNativeTrack,
  type NativeLibraryTrack,
} from '../lib/nativeLibrary';
import {
  filterLocalLibraryTracks,
  isLocalTrackPlayable,
  playableFromLocalTrack,
  useLocalLibraryStore,
} from '../stores/localLibraryStore';
import { usePlayerStore } from '../stores/playerStore';

const FILE_LABELS = {
  title: 'Add audio files',
  description:
    'File names are remembered on this device. Audio blobs clear on reload — choose the same files again to play. Uploading to your Tahti archive is Studio → Upload.',
  browse: 'Choose files',
};

export function DesktopLibraryPanel() {
  const [query, setQuery] = useState('');
  const tracks = useLocalLibraryStore((s) => s.tracks);
  const addFiles = useLocalLibraryStore((s) => s.addFiles);
  const remove = useLocalLibraryStore((s) => s.remove);
  const play = usePlayerStore((s) => s.play);
  const enqueue = usePlayerStore((s) => s.enqueue);
  const needsReimport = tracks.some((track) => !isLocalTrackPlayable(track));
  const filteredTracks = useMemo(
    () => filterLocalLibraryTracks(tracks, query),
    [query, tracks],
  );
  const nativePlayer = hasNativePlayer();
  const nativeLibrary = getNativeLibrary();
  const [nativeTracks, setNativeTracks] = useState<NativeLibraryTrack[]>([]);
  const [nativeTotal, setNativeTotal] = useState(0);
  const [nativeQuery, setNativeQuery] = useState('');
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);

  const refreshNative = useCallback(async () => {
    if (!nativeLibrary) {
      return;
    }
    setNativeLoading(true);
    setNativeError(null);
    try {
      const page = await nativeLibrary.list(nativeQuery, 0);
      setNativeTracks(page.tracks);
      setNativeTotal(page.total);
    } catch (error) {
      setNativeError(
        error instanceof Error ? error.message : 'Library unavailable.',
      );
    } finally {
      setNativeLoading(false);
    }
  }, [nativeLibrary, nativeQuery]);

  const loadMoreNative = async () => {
    if (!nativeLibrary || nativeLoading || nativeTracks.length >= nativeTotal) {
      return;
    }
    setNativeLoading(true);
    setNativeError(null);
    try {
      const page = await nativeLibrary.list(nativeQuery, nativeTracks.length);
      setNativeTracks((current) => [...current, ...page.tracks]);
      setNativeTotal(page.total);
    } catch (error) {
      setNativeError(
        error instanceof Error ? error.message : 'Library unavailable.',
      );
    } finally {
      setNativeLoading(false);
    }
  };

  useEffect(() => {
    void refreshNative();
  }, [refreshNative]);

  const importNative = async () => {
    if (!nativeLibrary) {
      return;
    }
    setNativeLoading(true);
    try {
      const result = await nativeLibrary.import();
      toast.success(
        result.imported === 1
          ? 'Imported 1 track.'
          : `Imported ${result.imported} tracks.`,
      );
      if (result.errors.length) {
        toast.error(`${result.errors.length} files could not be imported.`);
      }
      await refreshNative();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      setNativeLoading(false);
    }
  };

  const onFiles = (files: readonly File[]) => {
    const added = addFiles(files);
    if (added.length === 0) {
      toast.error('Choose an audio file.');
      return;
    }
    toast.success(
      added.length === 1
        ? `Ready “${added[0]?.title}”.`
        : `Ready ${added.length} files.`,
    );
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col gap-3 p-2"
      data-testid="desktop-library-panel"
    >
      {nativeLibrary ? (
        <>
          <Button
            variant="secondary"
            onClick={() => void importNative()}
            disabled={nativeLoading}
          >
            <LibraryIcon size={15} aria-hidden />
            {nativeLoading ? 'Importing…' : 'Import files'}
          </Button>
          <Input
            type="search"
            label="Search desktop library"
            placeholder="Title, artist, or album"
            value={nativeQuery}
            onChange={(event) => setNativeQuery(event.target.value)}
          />
          {nativeTracks.length ? (
            <>
              <ul className="tahti-hide-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {nativeTracks.map((track) => (
                  <li
                    key={track.id}
                    className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {track.title}
                      </p>
                      <p className="text-foreground-secondary truncate text-xs">
                        {track.artist || 'Unknown artist'}
                      </p>
                      <p className="text-foreground-secondary truncate text-[10px] opacity-70">
                        {track.album || 'Unknown album'} ·{' '}
                        {track.format.toUpperCase()} ·{' '}
                        {formatFileSize(track.sizeBytes)}
                      </p>
                    </div>
                    <Tooltip content="Play" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        aria-label={`Play ${track.title}`}
                        onClick={async () => {
                          try {
                            play(
                              playableFromNativeTrack(
                                track,
                                await nativeLibrary.resolve(track.id),
                              ),
                            );
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : 'Track unavailable.',
                            );
                          }
                        }}
                      >
                        <PlayIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Remove" side="top">
                      <Button
                        size="icon-sm"
                        variant="text"
                        intent="danger"
                        aria-label={`Remove ${track.title}`}
                        onClick={async () => {
                          try {
                            await nativeLibrary.remove(track.id);
                            setNativeTracks((current) =>
                              current.filter((item) => item.id !== track.id),
                            );
                            toast.success(`Removed “${track.title}”.`);
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : 'Could not remove track.',
                            );
                          }
                        }}
                      >
                        <TrashIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              {nativeTracks.length < nativeTotal ? (
                <Button
                  variant="text"
                  onClick={() => void loadMoreNative()}
                  disabled={nativeLoading}
                >
                  {nativeLoading
                    ? 'Loading…'
                    : `Load more (${nativeTotal - nativeTracks.length})`}
                </Button>
              ) : null}
            </>
          ) : nativeError ? (
            <EmptyState
              size="sm"
              title="Desktop library unavailable"
              description={nativeError}
              action={
                <Button
                  variant="secondary"
                  onClick={() => void refreshNative()}
                >
                  Retry
                </Button>
              }
              className="flex-1"
            />
          ) : (
            <EmptyState
              size="sm"
              icon={<LibraryIcon size={28} className="opacity-50" />}
              title="Desktop library"
              description={
                nativeLoading
                  ? 'Loading library…'
                  : 'Import files to build your offline library.'
              }
              className="flex-1"
            />
          )}
        </>
      ) : (
        <FilePicker
          accept="audio/*"
          multiple
          labels={FILE_LABELS}
          onFiles={onFiles}
        />
      )}
      {nativePlayer && !nativeLibrary ? (
        <p className="border-primary/30 bg-primary/5 text-foreground-secondary rounded-md border px-2 py-1.5 text-xs">
          Tahti Player desktop runtime detected. Native library is unavailable;
          browser imports remain available.
        </p>
      ) : null}
      {!nativeLibrary &&
        (tracks.length === 0 ? (
          <EmptyState
            size="sm"
            icon={<LibraryIcon size={28} className="opacity-50" />}
            title="Local library"
            description="Import files to play them in the Tahti player. Soulseek search lands here after the desktop add-on is connected."
            className="flex-1"
          />
        ) : (
          <>
            <Input
              type="search"
              label="Search local files"
              placeholder="Title, artist, or file name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {needsReimport ? (
              <p className="text-foreground-secondary text-xs">
                Some tracks need the original file again before they can play.
              </p>
            ) : null}
            {filteredTracks.length === 0 ? (
              <EmptyState
                size="sm"
                title="No local files found"
                description={`Nothing matches “${query.trim()}”.`}
                className="flex-1"
              />
            ) : (
              <ul className="tahti-hide-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                {filteredTracks.map((track) => {
                  const playable = isLocalTrackPlayable(track);
                  return (
                    <li
                      key={track.id}
                      className="border-border flex items-center gap-2 rounded-md border px-2 py-1.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {track.title}
                        </p>
                        <p className="text-foreground-secondary truncate text-xs">
                          {playable
                            ? track.artist
                            : `Re-import ${track.fileName} to play`}
                        </p>
                        {track.fileSize ? (
                          <p className="text-foreground-secondary truncate text-[10px] opacity-70">
                            {formatFileSize(track.fileSize)}
                            {track.mimeType ? ` · ${track.mimeType}` : ''}
                          </p>
                        ) : null}
                      </div>
                      <Tooltip content="Play" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          disabled={!playable}
                          aria-label={`Play ${track.title}`}
                          onClick={() => {
                            const next = playableFromLocalTrack(track);
                            if (next) {
                              play(next);
                            }
                          }}
                        >
                          <PlayIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Add to queue" side="top">
                        <Button
                          size="sm"
                          variant="text"
                          disabled={!playable}
                          aria-label={`Queue ${track.title}`}
                          onClick={() => {
                            const next = playableFromLocalTrack(track);
                            if (!next) {
                              return;
                            }
                            enqueue(next);
                            toast.success(`Queued “${track.title}”.`);
                          }}
                        >
                          Queue
                        </Button>
                      </Tooltip>
                      <Tooltip content="Remove" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          intent="danger"
                          aria-label={`Remove ${track.title}`}
                          onClick={() => {
                            remove(track.id);
                            toast.success(`Removed “${track.title}”.`);
                          }}
                        >
                          <TrashIcon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
