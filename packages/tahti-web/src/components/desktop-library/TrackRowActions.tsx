import { FolderOpenIcon, InfoIcon, PlayIcon, TrashIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, EditIconButton, Tooltip } from '@tahti-player/ui';

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
  const { t } = useTranslation('web');
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
            {t('trackRowActions.locate')}
          </Button>
        ) : (
          <>
            <Tooltip content={t('tooltips.play')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('trackRowActionsLabels.playTitle', {
                  title: track.title,
                })}
                onClick={() => onPlay(track)}
              >
                <PlayIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={t('tooltips.addToQueue')} side="top">
              <Button
                size="sm"
                variant="text"
                aria-label={t('trackRowActionsLabels.queueTitle', {
                  title: track.title,
                })}
                onClick={() => onQueue(track)}
              >
                {t('trackRowActions.queue')}
              </Button>
            </Tooltip>
            <Tooltip content={t('tooltips.revealInFolder')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('trackRowActionsLabels.revealTitleInFolder', {
                  title: track.title,
                })}
                onClick={() => onReveal(track)}
              >
                <FolderOpenIcon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </>
        )}
        <EditIconButton
          variant="text"
          label={t('trackRowActionsLabels.editTagsForTitle', {
            title: track.title,
          })}
          onClick={() => onEdit(track)}
        />
        <Tooltip content={t('tooltips.detailsI')} side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={t('trackRowActionsLabels.detailsForTitle', {
              title: track.title,
            })}
            onClick={() => onInspect(track)}
          >
            <InfoIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
        <Tooltip content={t('tooltips.removeFromLibrary')} side="top">
          <Button
            size="icon-sm"
            variant="text"
            intent="danger"
            aria-label={t('trackRowActionsLabels.removeTitle', {
              title: track.title,
            })}
            onClick={() => onRemove(track)}
          >
            <TrashIcon size={14} aria-hidden />
          </Button>
        </Tooltip>
      </>
    </>
  );
}
