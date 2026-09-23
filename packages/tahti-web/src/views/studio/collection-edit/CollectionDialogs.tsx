import { toast } from 'sonner';

import { Dialog, FilePicker } from '@tahti-player/ui';

import { removeStudioCollectionItem } from '../../../api/studio';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { ImageSlotPreviewDialog } from '../../../components/imageSlot/ImageSlotPreviewDialog';
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
        title={`Add content to ${isAlbumLike ? 'album' : 'collection'}`}
        sounds={sounds}
        existingSoundIds={existingSoundIds}
        addBusyId={addBusyId}
        isPreviewing={(sound) => currentId === `sound:${sound.id}` && isPlaying}
        onPreview={(sound) => void playSound(sound)}
        onPause={() => setStatus('paused')}
        onAdd={(sound) => void addSound(sound)}
      />
      <Dialog.Root
        isOpen={uploadTarget !== null}
        onClose={() => {
          if (!uploadingImage) {
            setUploadTarget(null);
          }
        }}
      >
        <Dialog.Title>
          Upload {uploadTarget === 'cover' ? 'cover' : 'backdrop'}
        </Dialog.Title>
        <Dialog.Description>
          {uploadTarget === 'cover'
            ? "Choose an image for this collection's cover art."
            : 'Choose one image for a still backdrop, or several for a slideshow.'}
        </Dialog.Description>
        <div className="mt-4">
          <FilePicker
            labels={{
              title:
                uploadTarget === 'cover' ? 'Cover image' : 'Backdrop images',
              description: 'JPEG, PNG, WebP, or GIF',
              browse: uploadingImage
                ? 'Uploading…'
                : uploadTarget === 'cover'
                  ? 'Choose image'
                  : 'Choose image(s)',
            }}
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={uploadTarget === 'backdrop'}
            disabled={uploadingImage}
            onFiles={(files) => void uploadImage(files)}
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>Cancel</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Root>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        title={`Remove "${pendingRemove?.title}"?`}
        description={`This removes the track from this ${isAlbumLike ? 'album' : 'collection'}. It stays in your library.`}
        confirmLabel="Remove"
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (!pendingRemove) {
            return;
          }
          const id = pendingRemove.id;
          setPendingRemove(null);
          void removeStudioCollectionItem(slug, id).then((result) => {
            if (result.ok) {
              toast.success('Track removed.');
              void refreshItems();
            } else {
              toast.error(result.error);
            }
          });
        }}
      />

      <ConfirmDialog
        isOpen={pendingCoverDelete}
        title="Remove cover image?"
        description="The collection will fall back to its default placeholder until you upload a new cover."
        confirmLabel="Remove cover"
        onCancel={() => setPendingCoverDelete(false)}
        onConfirm={() => {
          setPendingCoverDelete(false);
          void removeCover();
        }}
      />

      <ImageSlotPreviewDialog
        isOpen={backdropChrome.previewOpen && pendingFrameDelete === null}
        onClose={backdropChrome.closePreview}
        label="Backdrop"
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
        title="Remove this image from the backdrop?"
        description="It will be removed from the slideshow immediately."
        confirmLabel="Remove"
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
