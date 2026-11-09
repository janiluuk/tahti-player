import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Dialog, FilePicker } from '@tahti-player/ui';

import { removeStudioCollectionItem } from '../../../api/studio';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { CoverArtPickerDialog } from '../../../components/CoverArtPickerDialog';
import { ImageSlotPreviewDialog } from '../../../components/imageSlot/ImageSlotPreviewDialog';
import { webT } from '../../../lib/webT';
import { AddTracksDialog } from './AddTracksDialog';
import type { CollectionEditState } from './useCollectionEditState';

export function CollectionDialogs({
  slug,
  state,
  isAlbumLike,
}: {
  slug: string;
  state: CollectionEditState;
  isAlbumLike: boolean;
}) {
  const { t } = useTranslation('web');
  const {
    addPickerOpen,
    setAddPickerOpen,
    sounds,
    existingSoundIds,
    addBusyId,
    currentId,
    isPlaying,
    playSound,
    setStatus,
    addSound,
    uploadTarget,
    setUploadTarget,
    uploadingImage,
    uploadImage,
    coverUrl,
    uploadCoverFile,
    applyCover,
    pendingRemove,
    setPendingRemove,
    refreshItems,
    pendingCoverDelete,
    setPendingCoverDelete,
    removeCover,
    backdropChrome,
    pendingFrameDelete,
    setPendingFrameDelete,
    backdropUrl,
    slideshowImages,
    removeSlideshowFrame,
  } = state;

  return (
    <>
      <AddTracksDialog
        isOpen={addPickerOpen}
        onClose={() => setAddPickerOpen(false)}
        title={webT()('a11yNamed.addContentTo', {
          name: isAlbumLike ? 'album' : 'collection',
        })}
        sounds={sounds}
        existingSoundIds={existingSoundIds}
        addBusyId={addBusyId}
        isPreviewing={(sound) => currentId === `sound:${sound.id}` && isPlaying}
        onPreview={(sound) => void playSound(sound)}
        onPause={() => setStatus('paused')}
        onAdd={(sound) => void addSound(sound)}
      />
      <CoverArtPickerDialog
        isOpen={uploadTarget === 'cover'}
        onClose={() => setUploadTarget(null)}
        label={t('collectionDialogs.coverArt')}
        value={coverUrl}
        upload={uploadCoverFile}
        onSelect={applyCover}
      />
      <Dialog.Root
        isOpen={uploadTarget === 'backdrop'}
        onClose={() => {
          if (!uploadingImage) {
            setUploadTarget(null);
          }
        }}
      >
        <Dialog.Title>{t('collectionDialogs.uploadBackdrop')}</Dialog.Title>
        <Dialog.Description>
          {t('collectionDialogs.chooseOneImageForA')}
        </Dialog.Description>
        <div className="mt-4">
          <FilePicker
            labels={{
              title: t('collectionDialogsMore.backdropImages'),
              description: t('collectionDialogsMore.jpegPngWebpOrGif'),
              browse: uploadingImage
                ? t('collectionDialogsStates.uploading')
                : t('collectionDialogsStates.chooseImageS'),
            }}
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploadingImage}
            onFiles={(files) => void uploadImage(files)}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('collectionDialogs.cancel')}</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={t('studioCollectionEdit.removeTrackTitle', {
          title: pendingRemove?.title ?? '',
        })}
        description={t('studioCollectionEdit.removeTrackDescription', {
          kind: t(
            isAlbumLike
              ? 'studioCollectionEdit.kindAlbum'
              : 'studioCollectionEdit.kindCollection',
          ),
        })}
        confirmLabel={t('actions.remove')}
        destructive
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) {
            return;
          }
          const id = pendingRemove.id;
          setPendingRemove(null);
          void removeStudioCollectionItem(slug, id).then((result) => {
            if (result.ok) {
              toast.success(i18n.t('web:toasts.trackRemoved'));
              void refreshItems();
            } else {
              toast.error(result.error);
            }
          });
        }}
      />

      <ConfirmDialog
        isOpen={pendingCoverDelete}
        title={t('studioCollectionEdit.removeCoverTitle')}
        description={t('studioCollectionEdit.removeCoverDescription')}
        confirmLabel={t('studioCollectionEdit.removeCoverConfirm')}
        destructive
        onCancel={() => setPendingCoverDelete(false)}
        onConfirm={() => {
          setPendingCoverDelete(false);
          void removeCover();
        }}
      />

      <ImageSlotPreviewDialog
        isOpen={backdropChrome.previewOpen && pendingFrameDelete === null}
        onClose={backdropChrome.closePreview}
        label={t('collectionDialogs.backdrop')}
        src={backdropUrl}
        frames={
          slideshowImages.length > 1
            ? slideshowImages.map((url) => ({
                url,
                onDelete: () => setPendingFrameDelete(url),
              }))
            : undefined
        }
        onChangeClick={() => {
          backdropChrome.closePreview();
          setUploadTarget('backdrop');
        }}
        confirmOpen={backdropChrome.confirmOpen}
        clearing={backdropChrome.clearing}
        onRequestDelete={backdropChrome.requestDelete}
        onCancelDelete={backdropChrome.cancelDelete}
        onConfirmDelete={backdropChrome.confirmDelete}
      />

      <ConfirmDialog
        isOpen={pendingFrameDelete !== null}
        title={t('studioCollectionEdit.removeBackdropTitle')}
        description={t('studioCollectionEdit.removeBackdropDescription')}
        confirmLabel={t('actions.remove')}
        destructive
        onCancel={() => setPendingFrameDelete(null)}
        onConfirm={() => {
          const url = pendingFrameDelete;
          setPendingFrameDelete(null);
          if (url) {
            void removeSlideshowFrame(url);
          }
        }}
      />
    </>
  );
}
