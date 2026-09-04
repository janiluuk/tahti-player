import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  Maximize2Icon,
  Trash2Icon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button, ImageReveal, Tooltip } from '@tahti-player/ui';

import {
  deletePressKitImage,
  updatePressKitImage,
  uploadPressKitImages,
  type PressKitImageItem,
  type PublicPressKitImage,
} from '../api/artist-settings';
import { ConfirmDialog } from './ConfirmDialog';
import { ImageLightbox } from './ImageLightbox';

const ACCEPTED = 'image/jpeg,image/png,image/webp';

/** Position/includeInZip are only present for the owner's own fetch
 * (fetchMyPressKitImages) -- the public fetch omits them, and reordering is
 * owner-only anyway, so they stay optional here. */
type GalleryImage = PublicPressKitImage &
  Partial<Pick<PressKitImageItem, 'position' | 'includeInZip'>>;

type Props = {
  images: GalleryImage[];
  isOwner: boolean;
  onChange: (next: GalleryImage[]) => void;
  showUpload?: boolean;
};

export function ArtistGalleryPanel({
  images,
  isOwner,
  onChange,
  showUpload = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragId, setDragId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length || !isOwner) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await uploadPressKitImages(files);
    setBusy(false);
    if (result.images.length > 0) {
      onChange([...images, ...result.images]);
      toast.success(
        result.images.length === 1
          ? 'Photo added.'
          : `${result.images.length} photos added.`,
      );
    }
    if (result.errors.length > 0) {
      setError(result.errors.join('; '));
      toast.error(result.errors.join('; '));
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function onDelete(id: string) {
    if (!isOwner) {
      return;
    }
    const prev = images;
    onChange(images.filter((i) => i.id !== id));
    setSelected((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    const res = await deletePressKitImage(id);
    if (!res.ok) {
      onChange(prev);
      setError(res.error);
      toast.error(res.error);
    }
  }

  function requestDelete(id: string) {
    if (!isOwner) {
      return;
    }
    setPendingDeleteId(id);
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function removeSelected() {
    if (!isOwner || selected.size === 0) {
      return;
    }
    const ids = Array.from(selected);
    const prev = images;
    onChange(images.filter((i) => !selected.has(i.id)));
    setSelected(new Set());
    const results = await Promise.all(ids.map((id) => deletePressKitImage(id)));
    if (results.some((r) => !r.ok)) {
      onChange(prev);
      setError('Some images could not be removed.');
      toast.error('Some images could not be removed.');
    }
  }

  async function reorder(fromId: string, toId: string) {
    if (!isOwner || fromId === toId) {
      return;
    }
    const fromIndex = images.findIndex((i) => i.id === fromId);
    const toIndex = images.findIndex((i) => i.id === toId);
    if (fromIndex === -1 || toIndex === -1) {
      return;
    }
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
    await Promise.all(
      next.map((image, index) =>
        image.position !== undefined && image.position !== index
          ? updatePressKitImage(image.id, { position: index })
          : Promise.resolve(),
      ),
    );
  }

  function moveBy(id: string, delta: number) {
    const index = images.findIndex((i) => i.id === id);
    const target = images[index + delta];
    if (index === -1 || !target) {
      return;
    }
    void reorder(id, target.id);
  }

  const showToolbar =
    (isOwner && selected.size > 0) ||
    images.length > 0 ||
    (isOwner && showUpload);

  return (
    <section className="flex flex-col gap-4">
      {showToolbar ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isOwner && selected.size > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              className="text-accent-red"
              onClick={() => void removeSelected()}
            >
              <Trash2Icon size={14} aria-hidden className="mr-1.5" />
              Remove selected ({selected.size})
            </Button>
          ) : null}
          {images.length > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setLightbox(0)}
            >
              <Maximize2Icon size={14} aria-hidden className="mr-1.5" />
              Start slideshow
            </Button>
          ) : null}
          {isOwner && showUpload ? (
            <>
              <Tooltip content="Upload more gallery images" side="top">
                <Button
                  size="icon-sm"
                  variant="secondary"
                  disabled={busy}
                  aria-label={
                    busy
                      ? 'Uploading gallery images'
                      : 'Upload more gallery images'
                  }
                  onClick={() => inputRef.current?.click()}
                >
                  <ImagePlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={(e) => void onFiles(e.target.files)}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-accent-red text-sm">{error}</p> : null}

      {images.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, index) => (
            <li
              key={img.id}
              data-testid="gallery-photo"
              draggable={isOwner}
              onDragStart={() => setDragId(img.id)}
              onDragOver={(event) => {
                if (isOwner) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragId) {
                  void reorder(dragId, img.id);
                }
                setDragId(null);
              }}
              onDragEnd={() => setDragId(null)}
              className={`border-border group relative overflow-hidden rounded-lg border ${
                isOwner ? 'cursor-grab active:cursor-grabbing' : ''
              } ${dragId === img.id ? 'opacity-50' : ''}`}
            >
              <div className="relative">
                <Button
                  type="button"
                  variant="text"
                  size="flexible"
                  className="block w-full rounded-none p-0"
                  onClick={() => setLightbox(index)}
                  aria-label={img.title ?? 'View photo'}
                >
                  <ImageReveal
                    src={img.imageUrl}
                    alt={img.title ?? ''}
                    className="aspect-square w-full"
                    loading="lazy"
                  />
                </Button>
                {isOwner ? (
                  <>
                    <Tooltip
                      content={selected.has(img.id) ? 'Deselect' : 'Select'}
                      side="top"
                    >
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="text"
                        className={`absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-md border transition-opacity ${
                          selected.has(img.id)
                            ? 'bg-primary border-primary text-primary-foreground opacity-100'
                            : 'bg-background/80 border-border/60 text-transparent opacity-0 group-hover:opacity-100'
                        }`}
                        aria-label={
                          selected.has(img.id)
                            ? 'Deselect photo'
                            : 'Select photo'
                        }
                        aria-pressed={selected.has(img.id)}
                        onClick={() => toggleSelected(img.id)}
                      >
                        <CheckIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Remove photo" side="top">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="text"
                        className="bg-background/80 text-foreground absolute top-1.5 right-1.5 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Remove photo"
                        onClick={() => requestDelete(img.id)}
                      >
                        <Trash2Icon size={14} />
                      </Button>
                    </Tooltip>
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                      <Tooltip content="Move earlier" side="top">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="text"
                          className="bg-background/80 text-foreground rounded-md p-1 disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Move photo earlier"
                          disabled={index === 0}
                          onClick={() => moveBy(img.id, -1)}
                        >
                          <ChevronLeftIcon size={14} />
                        </Button>
                      </Tooltip>
                      <Tooltip content="Move later" side="top">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="text"
                          className="bg-background/80 text-foreground rounded-md p-1 disabled:pointer-events-none disabled:opacity-30"
                          aria-label="Move photo later"
                          disabled={index === images.length - 1}
                          onClick={() => moveBy(img.id, 1)}
                        >
                          <ChevronRightIcon size={14} />
                        </Button>
                      </Tooltip>
                    </div>
                  </>
                ) : null}
              </div>
              {img.title ? (
                <p className="text-foreground-secondary truncate px-2 py-1 text-xs">
                  {img.title}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox !== null && images[lightbox] ? (
        <ImageLightbox
          images={images}
          index={lightbox}
          label={images[lightbox]?.title ?? 'Gallery slideshow'}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Remove this photo?"
        description="The photo is removed from your gallery immediately."
        confirmLabel="Remove"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id) {
            void onDelete(id);
          }
        }}
      />
    </section>
  );
}

/** Owner-only control to start a gallery when none exists yet. */
export function ArtistGalleryAddIcon({
  onCreated,
}: {
  onCreated: (images: PublicPressKitImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await uploadPressKitImages(files);
    setBusy(false);
    if (result.images.length > 0) {
      onCreated(result.images);
      toast.success(
        result.images.length === 1
          ? 'Photo added.'
          : `${result.images.length} photos added.`,
      );
    }
    if (result.errors.length > 0) {
      setError(result.errors.join('; '));
      toast.error(result.errors.join('; '));
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Tooltip content={busy ? 'Uploading…' : 'Add gallery images'} side="top">
        <Button
          type="button"
          size="icon-sm"
          variant="secondary"
          disabled={busy}
          aria-label={busy ? 'Uploading gallery images' : 'Add gallery images'}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlusIcon size={16} />
        </Button>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => void onFiles(e.target.files)}
      />
      {error ? <p className="text-accent-red text-xs">{error}</p> : null}
    </div>
  );
}
