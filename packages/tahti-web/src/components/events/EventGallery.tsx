import { useId, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, MediaArtwork } from '@tahti-player/ui';

import type { ArtistEventGalleryImage } from '../../api/events';
import { ImageLightbox } from '../ImageLightbox';

/** Event page photo grid; a thumbnail opens the full-screen slideshow. */
export function EventGallery({
  images,
  title,
  seed,
}: {
  images: ArtistEventGalleryImage[];
  title: string;
  seed: string;
}) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState<number | null>(null);
  const headingId = useId();

  if (images.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="event-gallery"
      aria-labelledby={headingId}
      className="flex flex-col gap-2"
    >
      <h2 id={headingId} className="text-sm font-semibold">
        {t('eventGallery.heading')}
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, index) => {
          const position = index + 1;
          return (
            <li key={`${image.url}-${index}`} className="flex min-w-0 flex-col">
              <Button
                type="button"
                variant="plain"
                size="flexible"
                className="relative block aspect-square w-full overflow-hidden rounded-lg p-0"
                aria-label={
                  image.caption
                    ? t('eventGallery.openImageNamed', {
                        caption: image.caption,
                        position,
                        total: images.length,
                      })
                    : t('eventGallery.openImage', {
                        position,
                        total: images.length,
                      })
                }
                onClick={() => setOpen(index)}
              >
                <MediaArtwork
                  src={image.url}
                  alt={
                    image.caption ||
                    t('eventGallery.imageAlt', { title, position })
                  }
                  seed={`${seed}-gallery-${index}`}
                  size="fill"
                  imageReveal={false}
                />
              </Button>
              {image.caption ? (
                <p
                  className="text-foreground-secondary truncate px-1 pt-1 text-xs"
                  title={image.caption}
                >
                  {image.caption}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {open !== null ? (
        <ImageLightbox
          images={images.map((image) => ({
            imageUrl: image.url,
            caption: image.caption,
          }))}
          index={open}
          label={t('eventGallery.slideshowLabel', { title })}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </section>
  );
}
