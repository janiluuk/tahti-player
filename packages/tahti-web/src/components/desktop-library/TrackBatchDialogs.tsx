import type { TahtiNativeLibrary } from '../../lib/nativeLibrary';
import { OrganizeFilesDialog } from '../OrganizeFilesDialog';
import { TrackEditorDialog } from '../TrackEditorDialog';
import { TrackOrganizeDialog } from '../TrackOrganizeDialog';
import { WriteTagsDialog } from '../WriteTagsDialog';

export type TrackBatchDialog = {
  kind: 'edit' | 'writeTags' | 'organizeFiles' | 'rateAndLabel';
  ids: string[];
};

type Props = {
  library: TahtiNativeLibrary;
  dialog: TrackBatchDialog | null;
  onClose: () => void;
  onChanged: () => void;
};

/** The dialogs that act on a batch of track ids; only one is open at a time. */
export function TrackBatchDialogs({
  library,
  dialog,
  onClose,
  onChanged,
}: Props) {
  const ids = dialog?.ids ?? [];
  const shared = { onClose, library, ids, onChanged };
  return (
    <>
      <TrackEditorDialog isOpen={dialog?.kind === 'edit'} {...shared} />
      <WriteTagsDialog isOpen={dialog?.kind === 'writeTags'} {...shared} />
      <OrganizeFilesDialog
        isOpen={dialog?.kind === 'organizeFiles'}
        {...shared}
      />
      <TrackOrganizeDialog
        isOpen={dialog?.kind === 'rateAndLabel'}
        {...shared}
      />
    </>
  );
}
