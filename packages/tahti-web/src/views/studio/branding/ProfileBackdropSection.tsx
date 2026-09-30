import { useState } from 'react';
import { toast } from 'sonner';

import { Button, FilePicker, ImageReveal } from '@tahti-player/ui';

import {
  removeProfileBackdrop,
  uploadProfileBackdrop,
} from '../../../api/profile-backdrop';
import { StudioPanel } from '../../../components/StudioPanel';

export function ProfileBackdropSection({
  backdropUrl,
  onChange,
}: {
  backdropUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);

  const upload = async (files: readonly File[]) => {
    const file = files[0];
    if (!file) {
      return;
    }
    setBusy(true);
    const result = await uploadProfileBackdrop(file);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(result.data.backdropUrl);
    toast.success('Backdrop saved.');
  };

  const remove = async () => {
    setBusy(true);
    const result = await removeProfileBackdrop();
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(null);
  };

  return (
    <StudioPanel
      title="Profile backdrop"
      description="A wide image behind your artist page header. Your channel's slideshow, when set, is shown instead."
    >
      <div className="flex flex-col gap-3">
        {backdropUrl ? (
          <div className="flex flex-col gap-2" data-testid="profile-backdrop">
            <ImageReveal
              src={backdropUrl}
              alt="Current profile backdrop"
              className="aspect-[4/1] w-full rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={busy}
              onClick={() => void remove()}
            >
              Remove backdrop
            </Button>
          </div>
        ) : null}
        <FilePicker
          labels={{
            title: backdropUrl ? 'Replace backdrop' : 'Add a backdrop',
            description: 'JPEG, PNG or WebP, wide (about 4:1) works best',
            browse: busy ? 'Uploading…' : 'Choose image',
          }}
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onFiles={(files) => void upload(files)}
        />
      </div>
    </StudioPanel>
  );
}
