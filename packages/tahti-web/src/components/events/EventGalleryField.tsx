import {
  ArrowDownIcon,
  ArrowUpIcon,
  ImagesIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  FilePicker,
  InlineError,
  Input,
  Loader,
  MediaArtwork,
  Tooltip,
} from '@tahti-player/ui';

import type { ArtistEventGalleryImage } from '../../api/events';
import { uploadUserMediaFile } from '../../api/user-media';
import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../../lib/imageUploadContentType';
import { toastWithUndo } from '../../lib/undoToast';

export const EVENT_GALLERY_MAX_IMAGES = 30;
export const EVENT_GALLERY_CAPTION_MAX = 300;

type Upload = {
  id: number;
  name: string;
  error: string | null;
};

let nextUploadId = 0;

/** Event photo gallery: upload images to the viewer's media, caption,
 * reorder and remove them. */
export function EventGalleryField({
  value,
  onChange,
  seed,
  onUploadingChange,
}: {
  value: ArtistEventGalleryImage[];
  onChange: (gallery: ArtistEventGalleryImage[]) => void;
  seed: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const { t } = useTranslation('web');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [limitHit, setLimitHit] = useState(false);
  // Uploads finish out of order; each one appends to the latest list, not
  // the one captured when it started.
  const latest = useRef(value);
  latest.current = value;

  const commit = (next: ArtistEventGalleryImage[]) => {
    latest.current = next;
    onChange(next);
  };

  const pending = uploads.filter((upload) => upload.error === null).length;
  const remaining = EVENT_GALLERY_MAX_IMAGES - value.length - pending;

  useEffect(() => {
    onUploadingChange?.(pending > 0);
  }, [pending, onUploadingChange]);

  const uploadOne = async (file: File, id: number) => {
    const result = await uploadUserMediaFile(file);
    if (!result.ok) {
      setUploads((current) =>
        current.map((upload) =>
          upload.id === id ? { ...upload, error: result.error } : upload,
        ),
      );
      return;
    }
    setUploads((current) => current.filter((upload) => upload.id !== id));
    commit([...latest.current, { url: result.data.url, caption: '' }]);
  };

  const addFiles = (files: readonly File[]) => {
    const accepted = files.slice(0, Math.max(0, remaining));
    setLimitHit(accepted.length < files.length);
    const started = accepted.map((file) => ({
      id: ++nextUploadId,
      name: file.name,
      error: null,
    }));
    setUploads((current) => [...current, ...started]);
    accepted.forEach((file, index) => void uploadOne(file, started[index]!.id));
  };

  const setCaption = (index: number, caption: string) =>
    commit(
      latest.current.map((image, i) =>
        i === index ? { ...image, caption } : image,
      ),
    );

  const moveBy = (index: number, delta: -1 | 1) => {
    const next = [...latest.current];
    const [image] = next.splice(index, 1);
    if (!image) {
      return;
    }
    next.splice(index + delta, 0, image);
    commit(next);
  };

  const remove = (index: number) => {
    const removed = latest.current[index];
    if (!removed) {
      return;
    }
    commit(latest.current.filter((_, i) => i !== index));
    setLimitHit(false);
    toastWithUndo(t('eventGallery.imageRemoved'), {
      undo: async () => {
        if (latest.current.length >= EVENT_GALLERY_MAX_IMAGES) {
          return {
            ok: false as const,
            error: t('eventGallery.limitReached', {
              max: EVENT_GALLERY_MAX_IMAGES,
            }),
          };
        }
        const next = [...latest.current];
        next.splice(Math.min(index, next.length), 0, removed);
        commit(next);
        return { ok: true as const };
      },
      undoneMessage: t('eventGallery.imageRestored'),
    });
  };

  const full = remaining <= 0;
  const seen = new Map<string, number>();
  const keys = value.map((image) => {
    const count = seen.get(image.url) ?? 0;
    seen.set(image.url, count + 1);
    return count ? `${image.url}#${count}` : image.url;
  });

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      data-testid="event-gallery-field"
    >
      <legend className="mb-2 text-sm font-medium">
        {t('eventGallery.heading')}
      </legend>
      <FilePicker
        multiple
        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
        disabled={full}
        icon={<ImagesIcon size={20} aria-hidden />}
        labels={{
          title: t('eventGallery.addTitle'),
          description: t('eventGallery.addDescription', {
            max: EVENT_GALLERY_MAX_IMAGES,
          }),
          browse: t('eventGallery.choose'),
        }}
        onFiles={addFiles}
      />
      <p className="text-foreground-secondary text-xs">
        {t('eventGallery.count', {
          current: value.length,
          max: EVENT_GALLERY_MAX_IMAGES,
        })}
      </p>
      {full || limitHit ? (
        <InlineError textSize="xs">
          {t('eventGallery.limitReached', { max: EVENT_GALLERY_MAX_IMAGES })}
        </InlineError>
      ) : null}
      {uploads.length > 0 ? (
        <ul
          className="flex flex-col gap-1"
          aria-label={t('eventGallery.uploads')}
        >
          {uploads.map((upload) => (
            <li
              key={upload.id}
              className="flex items-center gap-2 text-xs"
              role={upload.error ? undefined : 'status'}
            >
              {upload.error ? (
                <>
                  <InlineError textSize="xs" className="min-w-0 flex-1">
                    {t('eventGallery.uploadFailed', {
                      name: upload.name,
                      error: upload.error,
                    })}
                  </InlineError>
                  <Tooltip content={t('eventGallery.dismiss')} side="top">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      aria-label={t('eventGallery.dismiss')}
                      onClick={() =>
                        setUploads((current) =>
                          current.filter((row) => row.id !== upload.id),
                        )
                      }
                    >
                      <XIcon size={14} aria-hidden />
                    </Button>
                  </Tooltip>
                </>
              ) : (
                <span className="text-foreground-secondary flex min-w-0 items-center gap-2">
                  <Loader size="sm" shape="circle" />
                  <span className="truncate">
                    {t('eventGallery.uploading', { name: upload.name })}
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {value.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {value.map((image, index) => (
            <li
              key={keys[index]}
              data-testid="event-gallery-item"
              className="border-border flex items-center gap-3 rounded-lg border p-2"
            >
              <MediaArtwork
                src={image.url}
                alt={
                  image.caption ||
                  t('eventGallery.imageNumber', { position: index + 1 })
                }
                seed={`${seed}-gallery-${index}`}
                size="md"
                imageReveal={false}
                className="rounded-md"
              />
              <Input
                className="min-w-0 flex-1"
                label={t('eventGallery.captionLabel', { position: index + 1 })}
                placeholder={t('eventGallery.captionPlaceholder')}
                maxLength={EVENT_GALLERY_CAPTION_MAX}
                value={image.caption}
                onChange={(event) => setCaption(index, event.target.value)}
              />
              <div className="flex shrink-0 gap-1">
                <Tooltip content={t('eventGallery.moveUp')} side="top">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="text"
                    aria-label={t('eventGallery.moveUpLabel', {
                      position: index + 1,
                    })}
                    disabled={index === 0}
                    onClick={() => moveBy(index, -1)}
                  >
                    <ArrowUpIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content={t('eventGallery.moveDown')} side="top">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="text"
                    aria-label={t('eventGallery.moveDownLabel', {
                      position: index + 1,
                    })}
                    disabled={index === value.length - 1}
                    onClick={() => moveBy(index, 1)}
                  >
                    <ArrowDownIcon size={14} aria-hidden />
                  </Button>
                </Tooltip>
                <Tooltip content={t('eventGallery.remove')} side="top">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="text"
                    aria-label={t('eventGallery.removeLabel', {
                      position: index + 1,
                    })}
                    onClick={() => remove(index)}
                  >
                    <Trash2Icon
                      size={14}
                      aria-hidden
                      className="text-accent-red-strong"
                    />
                  </Button>
                </Tooltip>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </fieldset>
  );
}
