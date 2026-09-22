import { DownloadIcon, Trash2Icon } from 'lucide-react';

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
  MAX_PRESS_KIT_SELECTED_IMAGES,
  updatePressKitImage,
} from '../../../api/artist-settings';
import { StudioPanel } from '../../../components/StudioPanel';
import { ACCEPTED_IMAGES } from './constants';
import { PressKitPreview } from './PressKitPreview';
import type { PressKitState } from './usePressKit';

export function PressKitSection({ kit }: { kit: PressKitState }) {
  const {
    user,
    profile,
    images,
    setImages,
    pressKit,
    setPressKit,
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
        title="Press kit story"
        description="A concise introduction for promoters, venues, and journalists."
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground-secondary text-xs uppercase">
            Short bio
          </span>
          <Textarea
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
        </label>
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
              Download ZIP
            </Button>
          ) : null}
          <SaveButton
            disabled={!pressKit}
            label="Save bio"
            onClick={() => void saveBio()}
          />
        </div>
      </StudioPanel>
      <StudioPanel
        title="Photos"
        description="Drop in high-resolution promotional photos. Drag to reorder them; the first included photo leads the preview and download."
      >
        <FilePicker
          accept={ACCEPTED_IMAGES}
          multiple
          disabled={busy}
          labels={{
            title: 'Drop press-kit photos here',
            description: 'JPEG, PNG, or WebP · up to 30 photos',
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
            Your press kit is empty. Add a bio and at least one photo to enable
            the download.
          </p>
        ) : null}
      </StudioPanel>
      <StudioPanel
        title="Press kit images"
        description={`${pressImages.length} of ${MAX_PRESS_KIT_SELECTED_IMAGES} press kit images · selecting another automatically drops the oldest selection`}
      >
        {images.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            Add images in the Gallery tab first.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
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
                    placeholder="Photo title or credit"
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
                    <span className="text-xs">Include in press kit</span>
                    <div className="flex items-center gap-2">
                      <Toggle
                        label={`Include ${image.title || `image ${image.position + 1}`} in press kit`}
                        checked={image.includeInZip}
                        onChange={() => void togglePressKitImage(image)}
                      />
                      <Tooltip content="Remove image" side="top">
                        <Button
                          size="icon-sm"
                          variant="text"
                          aria-label="Remove image from gallery"
                          onClick={() => setPendingImageDeleteId(image.id)}
                        >
                          <Trash2Icon size={14} aria-hidden />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
      <StudioPanel
        title="Press kit preview"
        description="What a promoter sees when opening your press kit."
      >
        <PressKitPreview
          displayName={profile?.displayName ?? user?.displayName ?? 'Artist'}
          bio={pressKit?.bioShort ?? null}
          images={pressImages}
        />
      </StudioPanel>
    </>
  );
}
