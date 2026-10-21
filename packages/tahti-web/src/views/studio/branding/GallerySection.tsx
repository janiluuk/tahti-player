import { ImagePlusIcon } from 'lucide-react';

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
        title="Gallery"
        action={
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-foreground-secondary text-xs">Public</span>
              <Toggle
                checked={galleryPublic}
                onChange={(checked) => void setVisibility(checked)}
                aria-label="Public gallery"
              />
            </label>
            <Tooltip content="Upload more gallery images" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label="Upload more gallery images"
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
        <Dialog.Title>Upload gallery images</Dialog.Title>
        <Dialog.Description>
          Add images with drag and drop, or browse your device.
        </Dialog.Description>
        <div className="flex flex-col gap-4">
          <FilterChips
            items={[
              { id: 'append', label: 'Append' },
              { id: 'replace', label: 'Replace' },
            ]}
            selected={uploadMode}
            onChange={(id) => setUploadMode(id as 'append' | 'replace')}
            aria-label="Gallery upload mode"
          />
          <FilePicker
            accept={ACCEPTED_IMAGES}
            multiple
            disabled={busy}
            selectedFiles={selectedGalleryFiles}
            labels={{
              title: 'Drop gallery images here',
              description: 'JPEG, PNG, or WebP',
              browse: 'Choose images',
              selected: 'Ready to upload',
            }}
            onFiles={(files) => {
              setSelectedGalleryFiles(Array.from(files));
              void uploadGallery(files);
            }}
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Include uploaded images in press kit</span>
            <Toggle
              label="Include uploaded images in press kit"
              checked={includeUploads}
              onChange={setIncludeUploads}
            />
          </div>
        </div>
        <Dialog.Actions>
          <Button disabled={busy} onClick={() => setGalleryUploadOpen(false)}>
            Done
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
}
