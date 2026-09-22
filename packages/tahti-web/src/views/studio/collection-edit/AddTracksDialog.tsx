import { PauseIcon, PlayIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button, Dialog, Input, Tooltip } from '@tahti-player/ui';

import type { StudioSound } from '../../../api/studio-types';

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Library picker for adding sounds to a collection. Owns the search box;
 * tracks already in the collection are hidden. */
export function AddTracksDialog({
  isOpen,
  onClose,
  title,
  sounds,
  existingSoundIds,
  addBusyId,
  isPreviewing,
  onPreview,
  onPause,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sounds: StudioSound[];
  existingSoundIds: ReadonlySet<string | undefined>;
  addBusyId: string | null;
  isPreviewing: (sound: StudioSound) => boolean;
  onPreview: (sound: StudioSound) => void;
  onPause: () => void;
  onAdd: (sound: StudioSound) => void;
}) {
  const [query, setQuery] = useState('');

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sounds.filter(
      (sound) =>
        !existingSoundIds.has(sound.id) &&
        (!q ||
          [sound.title, sound.genre, sound.contentType]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q)),
    );
  }, [sounds, existingSoundIds, query]);

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <Dialog.Title>{title}</Dialog.Title>
      <Dialog.Description>
        Choose library tracks to add. Tracks already in this collection are
        hidden.
      </Dialog.Description>
      <div className="mt-4 flex min-w-0 flex-col gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tracks by title, genre, or type…"
          aria-label="Search library tracks"
          endAddon={<SearchIcon size={16} aria-hidden />}
        />
        <div className="border-border max-h-96 min-h-0 overflow-auto rounded-md border">
          {available.length === 0 ? (
            <p className="text-foreground-secondary p-4 text-sm">
              {query.trim()
                ? 'No available tracks match your search.'
                : 'All library tracks are already in this collection.'}
            </p>
          ) : (
            <ul aria-label="Available library tracks">
              {available.map((sound, index) => {
                const previewing = isPreviewing(sound);
                return (
                  <li
                    key={sound.id}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm ${index % 2 === 1 ? 'bg-background-secondary/40' : 'bg-background'}`}
                  >
                    <Tooltip
                      content={`${previewing ? 'Pause' : 'Preview'} ${sound.title}`}
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant={previewing ? 'secondary' : 'text'}
                        aria-label={`${previewing ? 'Pause' : 'Preview'} ${sound.title}`}
                        onClick={() =>
                          previewing ? onPause() : onPreview(sound)
                        }
                      >
                        {previewing ? (
                          <PauseIcon size={15} aria-hidden />
                        ) : (
                          <PlayIcon size={15} aria-hidden />
                        )}
                      </Button>
                    </Tooltip>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{sound.title}</p>
                      <p className="text-foreground-secondary truncate text-xs">
                        {sound.artistName ?? 'Unknown artist'}
                        {sound.genre ? ` · ${sound.genre}` : ''}
                        {sound.durationSec
                          ? ` · ${formatDuration(sound.durationSec)}`
                          : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={addBusyId === sound.id}
                      onClick={() => onAdd(sound)}
                    >
                      <PlusIcon size={15} aria-hidden className="mr-1" />
                      {addBusyId === sound.id ? 'Adding…' : 'Add'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      <Dialog.Actions>
        <Dialog.Close>Done</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
