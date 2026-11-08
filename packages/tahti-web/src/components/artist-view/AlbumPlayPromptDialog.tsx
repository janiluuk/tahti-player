import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog } from '@tahti-player/ui';

export function AlbumPlayPromptDialog({
  title,
  onClose,
  onQueue,
  onPlayNow,
}: {
  title: string | null;
  onClose: () => void;
  onQueue: () => void;
  onPlayNow: () => void;
}) {
  const { t } = useTranslation('web');
  return (
    <Dialog.Root isOpen={title != null} onClose={onClose}>
      {title != null && (
        <>
          <Dialog.Title>Play {title}?</Dialog.Title>
          <Dialog.Description>
            {t('albumPlayPromptDialog.somethingAposSAlreadyQueued')}
          </Dialog.Description>
          <Dialog.Actions>
            <Dialog.Close>{t('albumPlayPromptDialog.cancel')}</Dialog.Close>
            <Button variant="secondary" onClick={onQueue}>
              {t('albumPlayPromptDialog.queueAlbum')}
            </Button>
            <Button onClick={onPlayNow}>
              {t('albumPlayPromptDialog.playNow')}
            </Button>
          </Dialog.Actions>
        </>
      )}
    </Dialog.Root>
  );
}
