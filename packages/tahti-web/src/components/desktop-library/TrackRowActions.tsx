import {
  FolderOpenIcon,
  InfoIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from 'lucide-react';

import { Button, Tooltip } from '@tahti-player/ui';

import type { NativeLibraryTrack } from '../../lib/nativeLibrary';

type Props = {
  track: NativeLibraryTrack;
  loading: boolean;
  onRelink: (track: NativeLibraryTrack) => void;
  onPlay: (track: NativeLibraryTrack) => void;
  onQueue: (track: NativeLibraryTrack) => void;
  onReveal: (track: NativeLibraryTrack) => void;
  onEdit: (track: NativeLibraryTrack) => void;
  onInspect: (track: NativeLibraryTrack) => void;
  onRemove: (track: NativeLibraryTrack) => void;
};

/** Per-row buttons of the track table. */
export function TrackRowActions({
  track,
  loading,
  onRelink,
  onPlay,
  onQueue,
  onReveal,
  onEdit,
  onInspect,
  onRemove,
}: Props) {
  return (
    <>
      <>
        {!track.available ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onRelink(track)}
            disabled={loading}
          >
            Locate
          </Button>
        ) : (
          <>
            <Tooltip content="Play" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={`Play ${track.title}`}
                onClick={() => onPlay(track)}
              >
                <PlayIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Add to queue" side="top">
              <Button
                size="sm"
                variant="text"
                aria-label={`Queue ${track.title}`}
                onClick={() => onQueue(track)}
              >
                Queue
              </Button>
            </Tooltip>
            <Tooltip content="Reveal in folder" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={`Reveal ${track.title} in folder`}
                onClick={() => onReveal(track)}
              >
                <FolderOpenIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </>
        )}
        <Tooltip content="Edit tags (E)" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Edit tags for ${track.title}`}
            onClick={() => onEdit(track)}
          >
            <PencilIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Details (I)" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Details for ${track.title}`}
            onClick={() => onInspect(track)}
          >
            <InfoIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content="Remove from library" side="top">
          <Button
            size="icon-sm"
            variant="text"
            intent="danger"
            aria-label={`Remove ${track.title}`}
            onClick={() => onRemove(track)}
          >
            <TrashIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
      </>
    </>
  );
}
