import { DownloadIcon, Trash2Icon } from 'lucide-react';
import { useRef } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilePicker,
  ImageReveal,
  Input,
  SaveButton,
  Textarea,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import {
  MAX_PRESS_KIT_IMAGES,
  MAX_PRESS_KIT_SELECTED_IMAGES,
  updatePressKitImage,
} from '../../../api/artist-settings';
import { PageError } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { ACCEPTED_IMAGES } from './constants';
import { PressKitPreview } from './PressKitPreview';
import type { PressKitState } from './usePressKit';

export function PressKitSection({ kit }: { kit: PressKitState }) {
  const { t } = useTranslation('web');
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const {
    user,
    profile,
    images,
    setImages,
    pressKit,
    setPressKit,
    pressKitError,
    reload,
    pressImages,
    busy,
    setSelectedGalleryFiles,
    uploadGallery,
    draggedPressKitImageId,
    setDraggedPressKitImageId,
    reorderPressKitImages,
    togglePressKitImage,
    setPendingImageDeleteId,
    saveBio,
  } = kit;
  return (
    <>
      <StudioPanel
        title={t('pressKit.pressKitStory')}
        description={t('pressKit.aConciseIntroductionForPromoters')}
      >
        {pressKitError ? (
          <PageError
            title={t('loadErrors.couldNotLoadYourPressKit')}
            description={pressKitError}
            onRetry={() => void reload()}
          />
        ) : null}
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            void saveBio();
          }}
        >
          <Textarea
            ref={bioRef}
            submitOnModEnter
            label={t('pressKit.shortBio')}
            fieldClassName={pressKitError ? 'hidden' : undefined}
            tone="secondary"
            rows={5}
            value={pressKit?.bioShort ?? ''}
            onChange={(event) =>
              setPressKit((current) =>
                current
                  ? { ...current, bioShort: event.target.value }
                  : current,
              )
            }
          />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {pressKit?.downloadPath ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  window.location.assign(pressKit.downloadPath ?? '')
                }
              >
                <DownloadIcon size={14} aria-hidden className="mr-1.5" />
                {t('pressKit.downloadZip')}
              </Button>
            ) : null}
            <SaveButton
              disabled={!pressKit}
              label={t('pressKit.saveBio')}
              type="submit"
            />
          </div>
        </form>
      </StudioPanel>
      <StudioPanel
        title={t('pressKit.photos')}
        description={t('pressKit.dropInHighResolutionPromotional')}
      >
        <FilePicker
          accept={ACCEPTED_IMAGES}
          multiple
          disabled={busy}
          labels={{
            title: 'Drop press-kit photos here',
            description: t('pressKitSectionLabels.jpegPngOrWebpUp', {
              MAX_PRESS_KIT_IMAGES,
            }),
            browse: 'Choose photos',
            selected: 'Ready to upload',
          }}
          onFiles={(files) => {
            setSelectedGalleryFiles(Array.from(files));
            void uploadGallery(files, true);
          }}
        />
        {images.length === 0 ? (
          <p className="text-foreground-secondary mt-3 text-sm">
            {t('pressKit.yourPressKitIsEmpty')}
          </p>
        ) : (
          <p className="text-foreground-secondary mt-4 mb-3 text-sm">
            {`${pressImages.length} of ${MAX_PRESS_KIT_SELECTED_IMAGES} photos in the press kit · choosing another drops the oldest choice`}
          </p>
        )}
        {images.length === 0 ? null : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => {
              const imageLabel =
                image.title?.trim() || `image ${image.position + 1}`;
              return (
                <li
                  key={image.id}
                  draggable
                  onDragStart={() => setDraggedPressKitImageId(image.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedPressKitImageId) {
                      void reorderPressKitImages(
                        draggedPressKitImageId,
                        image.id,
                      );
                    }
                    setDraggedPressKitImageId(null);
                  }}
                  onDragEnd={() => setDraggedPressKitImageId(null)}
                  className="border-border bg-background-secondary overflow-hidden rounded-lg border"
                >
                  <ImageReveal
                    src={image.imageUrl}
                    alt=""
                    className="aspect-[4/3] w-full"
                    imgClassName="object-cover"
                  />
                  <div className="flex flex-col gap-2 p-3">
                    <Input
                      aria-label={`Title for image ${image.position + 1}`}
                      value={image.title ?? ''}
                      placeholder={t('pressKit.photoTitleOrCredit')}
                      onChange={(event) => {
                        const title = event.target.value;
                        setImages((current) =>
                          current.map((candidate) =>
                            candidate.id === image.id
                              ? { ...candidate, title }
                              : candidate,
                          ),
                        );
                      }}
                      onBlur={(event) =>
                        void updatePressKitImage(image.id, {
                          title: event.target.value.trim() || null,
                        })
                      }
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs">
                        {t('pressKit.includeInPressKit')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Toggle
                          label={`Include ${image.title || `image ${image.position + 1}`} in press kit`}
                          checked={image.includeInZip}
                          onChange={() => void togglePressKitImage(image)}
                        />
                        <Tooltip
                          content={t('pressKitSectionLabels.removeImagelabel', {
                            imageLabel,
                          })}
                          side="top"
                        >
                          <Button
                            size="icon-sm"
                            variant="text"
                            aria-label={t(
                              'pressKitSectionLabels.removeImagelabel',
                              { imageLabel },
                            )}
                            onClick={() => setPendingImageDeleteId(image.id)}
                          >
                            <Trash2Icon
                              className="text-accent-red"
                              size={14}
                              aria-hidden
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </StudioPanel>
      <StudioPanel
        title={t('pressKit.pressKitPreview')}
        description={t('pressKit.whatAPromoterSeesWhen')}
      >
        <PressKitPreview
          displayName={profile?.displayName ?? user?.displayName ?? 'Artist'}
          bio={pressKit?.bioShort ?? null}
          images={pressImages}
          onEditBio={() => {
            bioRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
            bioRef.current?.focus({ preventScroll: true });
          }}
        />
      </StudioPanel>
    </>
  );
}
