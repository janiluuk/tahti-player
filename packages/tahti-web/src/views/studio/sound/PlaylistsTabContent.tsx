import { ArchiveIcon, ListMusicIcon, RadioTowerIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import type { SoundEditorState } from './useSoundEditor';

export function PlaylistsTabContent({
  state,
  isAudioClip,
}: {
  state: SoundEditorState;
  isAudioClip: boolean;
}) {
  const {
    item,
    setPlaylistOpen,
    rotationBusy,
    toggleRotation,
    saving,
    visibility,
    moveToStash,
  } = state;

  if (!item) {
    return null;
  }

  return (
    <section className="border-border bg-background-secondary/30 flex flex-col gap-5 rounded-xl border p-5">
      <div className="flex items-start gap-3">
        <ListMusicIcon
          size={28}
          className="text-primary shrink-0"
          aria-hidden
        />
        <div>
          <h2 className="font-semibold">Add to playlists</h2>
          <p className="text-foreground-secondary text-sm">
            Add this track to one or more playlists, or create a new playlist
            without leaving the track page.
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className="self-start"
        onClick={() => setPlaylistOpen(true)}
      >
        <ListMusicIcon size={15} aria-hidden className="mr-1.5" />
        Choose playlists
      </Button>
      <div className="border-border grid gap-3 border-t pt-4 sm:grid-cols-2">
        {!isAudioClip ? (
          <Button
            variant={item.isFallback ? 'secondary' : 'text'}
            disabled={rotationBusy}
            onClick={() => void toggleRotation()}
            aria-pressed={item.isFallback}
          >
            <RadioTowerIcon size={16} aria-hidden className="mr-1.5" />
            {item.isFallback ? 'Remove from rotation' : 'Add to rotation'}
          </Button>
        ) : null}
        <Button
          variant="text"
          disabled={saving || visibility === 'PRIVATE'}
          onClick={() => void moveToStash()}
        >
          <ArchiveIcon size={16} aria-hidden className="mr-1.5" />
          Move to private stash
        </Button>
      </div>
    </section>
  );
}
