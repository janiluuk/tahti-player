import { BlocksIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import { useSettingsModalStore } from '../stores/settingsModalStore';
import { UploadTrackDialog } from './UploadTrackDialog';

const UPLOAD_HINT =
  'Quick upload in a dialog. For the full journey, use Library → Upload.';

type Props = {
  size?: 'sm' | 'default';
  /** Center actions (e.g. empty state). */
  align?: 'start' | 'center';
  onUploaded?: () => void;
};

/** Upload + Import — entry points for adding tracks to the Music archive.
 * "Import" opens Settings → Add-ons → Import (see PluginStorePanel). */
export function AddToMusicActions({
  size = 'sm',
  align = 'start',
  onUploaded,
}: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <div
        className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}
      >
        <Tooltip content={UPLOAD_HINT} side="top">
          <Button
            size={size}
            onClick={() => setUploadOpen(true)}
            aria-label="Upload"
          >
            <UploadIcon size={16} aria-hidden className="mr-1.5" />
            Upload
          </Button>
        </Tooltip>
        <Button
          size={size}
          variant="secondary"
          title="Import"
          onClick={() =>
            useSettingsModalStore.getState().open('plugin-store', 'import')
          }
        >
          <BlocksIcon size={16} aria-hidden className="mr-1.5" />
          Import
        </Button>
      </div>
      <UploadTrackDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => onUploaded?.()}
      />
    </>
  );
}
