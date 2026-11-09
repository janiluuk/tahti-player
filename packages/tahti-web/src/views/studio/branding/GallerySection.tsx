import { ImagePlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  Dialog,
  FilePicker,
  FilterChips,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type { PressKitImageItem } from '../../../api/artist-settings';
import { ArtistGalleryPanel } from '../../../components/ArtistGalleryPanel';
import { StudioPanel } from '../../../components/StudioPanel';
import { ACCEPTED_IMAGES } from './constants';
import type { PressKitState } from './usePressKit';

export function GallerySection({ kit }: { kit: PressKitState }) {
  const { t } = useTranslation('web');
  const {
    images,
    setImages,
    galleryPublic,
    setVisibility,
    setGalleryUploadOpen,
    galleryUploadOpen,
    busy,
    setSelectedGalleryFiles,
    selectedGalleryFiles,
    uploadMode,
    setUploadMode,
    uploadGallery,
    includeUploads,
    setIncludeUploads,
  } = kit;
  return (
    <>
      <StudioPanel
        title={t('brandingGallery.gallery')}
        action={
          <div className="flex items-center gap-3">
            <Toggle
              label={t('brandingGallery.publicGallery')}
              showLabel
              labelPosition="start"
              labelClassName="text-foreground-secondary text-xs"
              checked={galleryPublic}
              onChange={(checked) => void setVisibility(checked)}
            />
            <Tooltip
              content={t('brandingGallery.uploadMoreGalleryImages')}
              side="top"
            >
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('brandingGallery.uploadMoreGalleryImages')}
                onClick={() => setGalleryUploadOpen(true)}
              >
                <ImagePlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          </div>
        }
      >
        <ArtistGalleryPanel
          images={images}
          isOwner
          showUpload={false}
          onChange={(next) => setImages(next as PressKitImageItem[])}
        />
      </StudioPanel>
      <Dialog.Root
        isOpen={galleryUploadOpen}
        onClose={() => {
          if (!busy) {
            setGalleryUploadOpen(false);
            setSelectedGalleryFiles([]);
          }
        }}
        className="max-w-lg"
      >
        <Dialog.Title>{t('brandingGallery.uploadGalleryImages')}</Dialog.Title>
        <Dialog.Description>
          {t('brandingGallery.addImagesWithDragAnd')}
        </Dialog.Description>
        <div className="flex flex-col gap-4">
          <FilterChips
            items={[
              { id: 'append', label: t('gallerySection.append') },
              { id: 'replace', label: t('gallerySection.replace') },
            ]}
            selected={uploadMode}
            onChange={(id) => setUploadMode(id as 'append' | 'replace')}
            aria-label={t('brandingGallery.galleryUploadMode')}
          />
          <FilePicker
            accept={ACCEPTED_IMAGES}
            multiple
            disabled={busy}
            selectedFiles={selectedGalleryFiles}
            labels={{
              title: t('gallerySection.dropGalleryImagesHere'),
              description: t('gallerySection.jpegPngOrWebp'),
              browse: 'Choose images',
              selected: 'Ready to upload',
            }}
            onFiles={(files) => {
              setSelectedGalleryFiles(Array.from(files));
              void uploadGallery(files);
            }}
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{t('brandingGallery.includeUploadedImagesInPress')}</span>
            <Toggle
              label={t('brandingGallery.includeUploadedImagesInPress')}
              checked={includeUploads}
              onChange={setIncludeUploads}
            />
          </div>
        </div>
        <Dialog.Actions>
          <Button
            disabled={busy}
            variant="secondary"
            onClick={() => setGalleryUploadOpen(false)}
          >
            {t('brandingGallery.done')}
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
