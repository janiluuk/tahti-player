import { MicIcon, UploadIcon } from 'lucide-react';

import { Button, Dialog, FilePicker, FilterChips } from '@tahti-player/ui';

import type { StudioShowSeries } from '../../../api/shows';
import type { ShowDetailState } from './useShowDetail';

export function NewEpisodeDialog({
  show,
  state,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
}) {
  const {
    createOpen,
    setCreateOpen,
    source,
    setSource,
    file,
    setFile,
    busy,
    nextEpisodeNumber,
    defaultEpisodeTitle,
    nextSlotHint,
    createNewEpisode,
  } = state;

  return (
    <Dialog.Root isOpen={createOpen} onClose={() => setCreateOpen(false)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void createNewEpisode();
        }}
      >
        <Dialog.Title>New episode</Dialog.Title>
        <Dialog.Description>
          Prefills from the show — you only need audio.
        </Dialog.Description>
        <div className="mt-4 flex flex-col gap-3">
          <div className="border-border bg-background-secondary rounded-lg border px-3 py-2 text-sm">
            <p>
              <span className="text-foreground-secondary text-xs uppercase">
                Episode number
              </span>
              <br />
              <strong className="font-display text-2xl">
                #{nextEpisodeNumber}
              </strong>
            </p>
            <p className="text-foreground-secondary mt-2 text-xs">
              Title: {defaultEpisodeTitle}
            </p>
            {show.description ? (
              <p className="text-foreground-secondary mt-1 line-clamp-2 text-xs">
                Description: {show.description}
              </p>
            ) : null}
            {nextSlotHint ? (
              <p className="text-foreground-secondary mt-1 text-xs">
                Schedule: {new Date(nextSlotHint.startAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-foreground-secondary mt-1 text-xs">
                Schedule: book a slot after create if needed
              </p>
            )}
          </div>

          <FilterChips
            items={[
              {
                id: 'upload',
                label: 'Upload audio',
                icon: <UploadIcon size={14} aria-hidden />,
              },
              {
                id: 'broadcast',
                label: 'Record from broadcast',
                icon: <MicIcon size={14} aria-hidden />,
              },
            ]}
            selected={source}
            onChange={(id) => setSource(id as 'upload' | 'broadcast')}
            aria-label="Episode source"
          />

          {source === 'upload' ? (
            <FilePicker
              labels={{
                title: 'Episode audio',
                description: 'MP3, WAV, FLAC, or AIFF',
                browse: file ? 'Choose another file' : 'Choose audio',
              }}
              accept="audio/*,.flac,.wav,.mp3,.aiff"
              selectedFiles={file ? [file] : []}
              onFiles={(files) => setFile(files[0] ?? null)}
            />
          ) : (
            <p className="text-foreground-secondary text-sm">
              Creates a pending episode. Go Live to capture, then review,
              trim/normalize, and approve before it can air.
            </p>
          )}
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button
            type="submit"
            disabled={busy || (source === 'upload' && !file)}
          >
            {busy
              ? 'Creating…'
              : source === 'broadcast'
                ? 'Create & go record'
                : 'Create episode'}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
}
