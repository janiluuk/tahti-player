import {
  ActivityIcon,
  FolderTreeIcon,
  ListPlusIcon,
  PencilIcon,
  PlayIcon,
  SaveIcon,
  StarIcon,
  TrashIcon,
} from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Loader } from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
  return selectedCount === 0 ? (
    <>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onPlayAll()}
      >
        {selectionBusy ? (
          <Loader size="inline" shape="circle" />
        ) : (
          <PlayIcon size={14} aria-hidden />
        )}
        Play all
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy || nativeTotal === 0}
        onClick={onAddAllToPlaylist}
      >
        <ListPlusIcon size={14} aria-hidden />
        {t('desktopSelection.addAllToPlaylist')}
      </Button>
    </>
  ) : (
    <>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onPlay()}
      >
        {selectionBusy ? (
          <Loader size="inline" shape="circle" />
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
        {t('desktopSelection.playNext')}
      </Button>
      <Button
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onQueue()}
      >
        {t('desktopSelection.addToQueue')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onEditTags()}
      >
        <PencilIcon size={14} aria-hidden />
        {t('desktopSelection.editTags')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onWriteTags()}
      >
        <SaveIcon size={14} aria-hidden />
        {t('desktopSelection.writeTagsToFiles')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onOrganizeFiles()}
      >
        <FolderTreeIcon size={14} aria-hidden />
        {t('desktopSelection.organizeFiles')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy || analyzing}
        onClick={() => onAnalyze()}
      >
        {analyzing ? (
          <Loader size="inline" shape="circle" />
        ) : (
          <ActivityIcon size={14} aria-hidden />
        )}
        Analyze
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={() => onRateAndLabel()}
      >
        <StarIcon size={14} aria-hidden />
        {t('desktopSelection.rateAndLabel')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        disabled={selectionBusy}
        onClick={onAddToPlaylist}
      >
        <ListPlusIcon size={14} aria-hidden />
        {t('desktopSelection.addToPlaylist')}
      </Button>
      <Button
        className="gap-1.5"
        size="sm"
        variant="text"
        intent="danger"
        disabled={selectionBusy}
        onClick={() => onRemove()}
      >
        <TrashIcon size={14} aria-hidden />
        {t('desktopSelection.remove')}
      </Button>
    </>
  );
}
