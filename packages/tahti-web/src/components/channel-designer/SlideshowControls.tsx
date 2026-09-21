import {
  GripVerticalIcon,
  ImageIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Dialog,
  FilePicker,
  MediaArtwork,
  Select,
  Slider,
  Toggle,
  Tooltip,
} from '@tahti-player/ui';

import type { ChannelGalleryMode } from '../../api/channel-gallery';
import { Eyebrow } from '../tahti/Eyebrow';
import { GALLERY_MODES, SLIDESHOW_PRESETS } from './slideshowOptions';

type Props = {
  images: string[];
  previewIndex: number;
  onPreviewIndexChange: (index: number) => void;
  busy: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  pickedFiles: File[];
  onFilesPicked: (files: readonly File[]) => Promise<void>;
  galleryMode: ChannelGalleryMode;
  onGalleryModeChange: (mode: ChannelGalleryMode) => void;
  preset: string;
  onPresetChange: (preset: string) => void;
  interval: number;
  onIntervalChange: (seconds: number) => void;
  transition: number;
  onTransitionChange: (ms: number) => void;
  autoplay: boolean;
  onAutoplayChange: (autoplay: boolean) => void;
};

/** Gallery thumbnails (drag to reorder), style picker and slideshow timing. */
export function SlideshowControls({
  images,
  previewIndex,
  onPreviewIndexChange,
  busy,
  onReorder,
  onRemove,
  pickerOpen,
  onPickerOpenChange,
  pickedFiles,
  onFilesPicked,
  galleryMode,
  onGalleryModeChange,
  preset,
  onPresetChange,
  interval,
  onIntervalChange,
  transition,
  onTransitionChange,
  autoplay,
  onAutoplayChange,
}: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between gap-2">
              <Eyebrow>
                {images.length === 1
                  ? 'Single image preview'
                  : `Slideshow · ${images.length} images`}
              </Eyebrow>
              <span className="text-foreground-secondary text-xs">
                {previewIndex + 1} / {images.length}
              </span>
            </div>
            <div className="border-border bg-background relative h-36 overflow-hidden rounded-lg border">
              <MediaArtwork src={images[previewIndex]} alt="" size="fill" />
            </div>
          </>
        )}
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="group relative"
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedIndex !== null) {
                  onReorder(draggedIndex, index);
                }
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
            >
              <Button
                variant="text"
                className={`border-border relative block h-16 w-full overflow-hidden rounded-md border p-0 ${index === previewIndex ? 'border-primary ring-primary ring-2' : ''}`}
                aria-label={`Preview slideshow image ${index + 1}`}
                aria-pressed={index === previewIndex}
                onClick={() => onPreviewIndexChange(index)}
              >
                <MediaArtwork src={image} alt="" size="fill" />
              </Button>
              <div
                aria-hidden
                className="pointer-events-none absolute top-1 left-1 flex size-5 items-center justify-center rounded bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <GripVerticalIcon size={12} />
              </div>
              <Tooltip
                content={`Remove slideshow image ${index + 1}`}
                side="top"
              >
                <Button
                  size="icon-sm"
                  variant="secondary"
                  className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  aria-label={`Remove slideshow image ${index + 1}`}
                  onClick={() => onRemove(index)}
                >
                  <Trash2Icon size={14} aria-hidden />
                </Button>
              </Tooltip>
            </div>
          ))}
          <Tooltip content="Add gallery images" side="top">
            <Button
              variant="text"
              className="border-border text-foreground-secondary hover:border-primary hover:text-primary h-16 w-full rounded-md border border-dashed"
              aria-label="Add gallery images"
              disabled={busy}
              onClick={() => onPickerOpenChange(true)}
            >
              <PlusIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        </div>
        {images.length === 0 && (
          <p className="text-foreground-secondary text-xs">
            Upload images to build the slideshow behind your channel.
          </p>
        )}
      </div>
      <Dialog.Root
        isOpen={pickerOpen}
        onClose={() => onPickerOpenChange(false)}
        className="max-w-md"
      >
        <Dialog.Title>Add gallery images</Dialog.Title>
        <div className="mt-4">
          <FilePicker
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            selectedFiles={pickedFiles}
            icon={<ImageIcon size={20} aria-hidden />}
            labels={{
              title: 'Drop slideshow images here',
              description: 'JPEG, PNG, or WebP · up to 10 images',
              browse: 'Browse images',
            }}
            onFiles={(files) => {
              void onFilesPicked(files).then(() => onPickerOpenChange(false));
            }}
          />
        </div>
      </Dialog.Root>
      <Select
        label="Gallery style"
        value={galleryMode}
        onValueChange={(value) =>
          onGalleryModeChange(value as ChannelGalleryMode)
        }
        options={GALLERY_MODES.map((mode) => ({
          id: mode.id,
          label: mode.label,
        }))}
      />
      {images.length > 1 ? (
        <>
          <Select
            label="Transition"
            value={preset}
            onValueChange={onPresetChange}
            options={SLIDESHOW_PRESETS.map(([id, label]) => ({ id, label }))}
          />
          <Slider
            label={`Interval: ${interval}s`}
            min={5}
            max={30}
            step={1}
            value={interval}
            onValueChange={onIntervalChange}
          />
          <Slider
            label={`Transition speed: ${transition}ms`}
            min={300}
            max={1500}
            step={100}
            value={transition}
            onValueChange={onTransitionChange}
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Automatically advance slides</span>
            <Toggle
              label="Automatically advance slides"
              checked={autoplay}
              onChange={onAutoplayChange}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}
