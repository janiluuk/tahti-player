import { useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, FilePicker, ImageReveal } from '@tahti-player/ui';

import {
  removeProfileBackdrop,
  uploadProfileBackdrop,
} from '../../../api/profile-backdrop';

/** Upload, replace or remove the wide image behind the artist page header. */
export function ProfileBackdropDialog({
  isOpen,
  onClose,
  backdropUrl,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  backdropUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useTranslation('web');
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
    toast.success(i18n.t('web:toasts.backdropSaved'));
    onClose();
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
    <Dialog.Root
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      className="max-w-xl"
    >
      <Dialog.Title>{t('profileBackdropSection.profileBackdrop')}</Dialog.Title>
      <Dialog.Description>
        {t('profileBackdropSection.aWideImageBehindYour')}
      </Dialog.Description>
      <div className="mt-4 flex flex-col gap-3">
        {backdropUrl ? (
          <div className="flex flex-col gap-2" data-testid="profile-backdrop">
            <ImageReveal
              src={backdropUrl}
              alt={t('studioStringsBatch37.currentProfileBackdrop')}
              className="aspect-[4/1] w-full rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={busy}
              onClick={() => void remove()}
            >
              {t('profileBackdropSection.removeBackdrop')}
            </Button>
          </div>
        ) : null}
        <FilePicker
          labels={{
            title: backdropUrl
              ? t('profileBackdropSectionStates.replaceBackdrop')
              : t('profileBackdropSectionStates.addABackdrop'),
            description: t('profileBackdropSectionFields.jpegPngOrWebpWide'),
            browse: busy
              ? t('profileBackdropSectionStates.uploading')
              : t('profileBackdropSectionStates.chooseImage'),
          }}
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onFiles={(files) => void upload(files)}
        />
      </div>
      <Dialog.Actions>
        <Dialog.Close>{t('actions.cancel')}</Dialog.Close>
      </Dialog.Actions>
    </Dialog.Root>
  );
}
