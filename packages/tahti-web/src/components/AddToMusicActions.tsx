import { BlocksIcon, UploadIcon } from 'lucide-react';
import { useState } from 'react';

import { Button, ButtonLink, Tooltip } from '@tahti-player/ui';

import { useSettingsModalStore } from '../stores/settingsModalStore';
import { UploadTrackDialog } from './UploadTrackDialog';

const UPLOAD_HINT =
  'Quick upload in a dialog. For the full journey, use Library → Upload.';

type Props = {
  size?: 'sm' | 'default';
  /** Center actions (e.g. empty state). */
  align?: 'start' | 'center';
  onUploaded?: () => void;
  /** When set, Upload navigates here instead of opening the quick dialog. */
  uploadTo?: '/library/upload';
};

/** Upload + Import — entry points for adding tracks to the Music archive.
 * "Import" opens Settings → Add-ons → Import (see PluginStorePanel). */
export function AddToMusicActions({
  size = 'sm',
  align = 'start',
  onUploaded,
  uploadTo,
}: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <div
        className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}
      >
        {uploadTo ? (
          <ButtonLink to={uploadTo} size={size} aria-label="Upload">
            <UploadIcon size={16} aria-hidden className="mr-1.5" />
            Upload
          </ButtonLink>
        ) : (
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
        )}
        <Button
          size={size}
          variant="secondary"
          onClick={() =>
            useSettingsModalStore.getState().open('plugin-store', 'import')
          }
        >
          <BlocksIcon size={16} aria-hidden className="mr-1.5" />
          Import
        </Button>
      </div>
      {uploadTo ? null : (
        <UploadTrackDialog
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => onUploaded?.()}
        />
      )}
    </>
  );
}
