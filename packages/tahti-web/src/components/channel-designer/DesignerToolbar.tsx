import {
  BookmarkPlusIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  Undo2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Popover, Tooltip } from '@tahti-player/ui';

type Props = {
  dirty: boolean;
  busy?: boolean;
  hasPreviousSave: boolean;
  onOpenSavePresetModal: () => void;
  onRequestReset: () => void;
  onRestorePreviousSave: () => void;
  saveButton: ReactNode;
  openChannelLink: ReactNode;
};

/** The row above the live preview: more-options menu, restore, save, and
 * the "open my channel" link. */
export function DesignerToolbar({
  dirty,
  busy = false,
  hasPreviousSave,
  onOpenSavePresetModal,
  onRequestReset,
  onRestorePreviousSave,
  saveButton,
  openChannelLink,
}: Props) {
  const { t } = useTranslation('web');
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Popover
        anchor="bottom end"
        trigger={
          <Button
            type="button"
            variant="secondary"
            aria-label={t('designerToolbar.moreChannelDesignOptions')}
            className="gap-1.5"
          >
            …
            <ChevronDownIcon size={16} className="opacity-70" />
          </Button>
        }
      >
        <Popover.Menu>
          <Popover.Item
            icon={<BookmarkPlusIcon size={16} />}
            onClick={onOpenSavePresetModal}
          >
            {t('designerToolbar.savePreset')}
          </Popover.Item>
          <Popover.Item
            icon={<RotateCcwIcon size={16} />}
            disabled={!dirty || busy}
            onClick={onRequestReset}
          >
            {t('designerToolbar.reset')}
          </Popover.Item>
        </Popover.Menu>
      </Popover>
      {hasPreviousSave ? (
        <Tooltip content={t('designerToolbar.restorePreviousSave')} side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label={t('designerToolbar.restorePreviousSave')}
            onClick={onRestorePreviousSave}
          >
            <Undo2Icon size={15} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      <Button
        variant="secondary"
        disabled={!dirty || busy}
        onClick={onRequestReset}
      >
        <RotateCcwIcon size={15} aria-hidden />
        {t('designerToolbar.revertChanges')}
      </Button>
      {saveButton}
      {openChannelLink}
    </div>
  );
}
