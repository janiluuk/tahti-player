import {
  ActivityIcon,
  FolderTreeIcon,
  ListPlusIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  SaveIcon,
  StarIcon,
  TrashIcon,
} from 'lucide-react';

import { Button } from '@tahti-player/ui';

type Props = {
  /** Number of selected rows; the toolbar acts on the whole view when 0. */
  selectedCount: number;
  nativeTotal: number;
  selectionBusy: boolean;
  analyzing: boolean;
  onPlayAll: () => void;
  onAddAllToPlaylist: () => void;
  onPlay: () => void;
  onPlayNext: () => void;
  onQueue: () => void;
  onEditTags: () => void;
  onWriteTags: () => void;
  onOrganizeFiles: () => void;
  onAnalyze: () => void;
  onRateAndLabel: () => void;
  onAddToPlaylist: () => void;
  onRemove: () => void;
};

/** Actions above the track table: whole-view when nothing is selected. */
export function SelectionToolbar({
  selectedCount,
  nativeTotal,
  selectionBusy,
  analyzing,
  onPlayAll,
  onAddAllToPlaylist,
  onPlay,
  onPlayNext,
  onQueue,
  onEditTags,
  onWriteTags,
  onOrganizeFiles,
  onAnalyze,
  onRateAndLabel,
  onAddToPlaylist,
  onRemove,
}: Props) {
  return selectedCount === 0 ? (
    <>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onPlayAll()}
      >
        {selectionBusy ? (
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
        ) : (
          <PlayIcon size={14} aria-hidden />
        )}
        Play all
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy || nativeTotal === 0}
        onClick={onAddAllToPlaylist}
      >
        <ListPlusIcon size={14} aria-hidden />
        Add all to playlist
      </Button>
    </>
  ) : (
    <>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onPlay()}
      >
        {selectionBusy ? (
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
        ) : (
          <PlayIcon size={14} aria-hidden />
        )}
        Play
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onPlayNext()}
      >
        Play next
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onQueue()}
      >
        Add to queue
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onEditTags()}
      >
        <PencilIcon size={14} aria-hidden />
        Edit tags
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onWriteTags()}
      >
        <SaveIcon size={14} aria-hidden />
        Write tags to files
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onOrganizeFiles()}
      >
        <FolderTreeIcon size={14} aria-hidden />
        Organize files
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy || analyzing}
        onClick={() => onAnalyze()}
      >
        {analyzing ? (
          <LoaderCircleIcon size={14} className="animate-spin" aria-hidden />
        ) : (
          <ActivityIcon size={14} aria-hidden />
        )}
        Analyze
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onRateAndLabel()}
      >
        <StarIcon size={14} aria-hidden />
        Rate and label
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={onAddToPlaylist}
      >
        <ListPlusIcon size={14} aria-hidden />
        Add to playlist
      </Button>
      <Button
        size="sm"
        variant="text"
        intent="danger"
        disabled={selectionBusy}
        onClick={() => onRemove()}
      >
        <TrashIcon size={14} aria-hidden />
        Remove
      </Button>
    </>
  );
}
