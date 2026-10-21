import {
  BookmarkPlusIcon,
  ChevronDownIcon,
  RotateCcwIcon,
  Undo2Icon,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Popover, Tooltip } from '@tahti-player/ui';

type Props = {
  dirty: boolean;
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
  hasPreviousSave,
  onOpenSavePresetModal,
  onRequestReset,
  onRestorePreviousSave,
  saveButton,
  openChannelLink,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Popover
        anchor="bottom end"
        trigger={
          <Button
            type="button"
            variant="secondary"
            aria-label="More options"
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
            Save preset
          </Popover.Item>
          <Popover.Item
            icon={<RotateCcwIcon size={16} />}
            disabled={!dirty}
            onClick={onRequestReset}
          >
            Reset
          </Popover.Item>
        </Popover.Menu>
      </Popover>
      {hasPreviousSave ? (
        <Tooltip content="Restore previous save" side="top">
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Restore previous save"
            onClick={onRestorePreviousSave}
          >
            <Undo2Icon size={15} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
      {saveButton}
      {openChannelLink}
    </div>
  );
}
