import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { FC, useEffect, useRef } from 'react';

import { Button, Dialog, ImageReveal, Tooltip } from '@tahti-player/ui';

export type LightboxImage = {
  imageUrl: string;
  title?: string | null;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  index: number;
  label: string;
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  /** When set, shows a Remove control for the current frame (owner gallery). */
  onDeleteCurrent?: () => void;
};

export const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  index,
  label,
  onIndexChange,
  onClose,
  onDeleteCurrent,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const image = images[index];
  const canNavigate = images.length > 1 && Boolean(onIndexChange);

  const move = (direction: -1 | 1) => {
    if (!canNavigate || !onIndexChange) {
      return;
    }
    onIndexChange((index + direction + images.length) % images.length);
  };

  useEffect(() => {
    panelRef.current?.focus();
  }, [index]);

  if (!image) {
    return null;
  }

  return (
    <Dialog.Root
      isOpen
      onClose={onClose}
      showCloseButton={false}
      className="max-w-5xl border-transparent bg-transparent p-0 shadow-none"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        aria-label={label}
        className="relative outline-none"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            move(-1);
          } else if (event.key === 'ArrowRight') {
            move(1);
          } else if (event.key === 'Home' && onIndexChange) {
            onIndexChange(0);
          } else if (event.key === 'End' && onIndexChange) {
            onIndexChange(images.length - 1);
          }
        }}
      >
        <div className="absolute top-0 right-0 z-10 flex gap-1">
          {onDeleteCurrent ? (
            <Tooltip content="Remove photo" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                className="text-accent-red"
                aria-label="Remove photo"
                onClick={onDeleteCurrent}
              >
                <Trash2Icon size={18} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip content="Close" side="top">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label="Close image viewer"
              onClick={onClose}
            >
              <XIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        </div>
        {canNavigate ? (
          <>
            <Tooltip content="Previous image" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute top-1/2 left-0 z-10 -translate-y-1/2"
                aria-label="Previous image"
                onClick={() => move(-1)}
              >
                <ChevronLeftIcon size={20} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content="Next image" side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute top-1/2 right-0 z-10 -translate-y-1/2"
                aria-label="Next image"
                onClick={() => move(1)}
              >
                <ChevronRightIcon size={20} aria-hidden />
              </Button>
            </Tooltip>
          </>
        ) : null}
        <figure className="flex max-h-full max-w-full flex-col items-center gap-3 px-10 pt-8">
          <ImageReveal
            src={image.imageUrl}
            alt={image.title ?? ''}
            loading="eager"
            className="max-h-[75vh] max-w-full"
            imgClassName="max-h-[75vh] max-w-full object-contain"
          />
          <figcaption className="text-foreground flex items-center gap-3 text-sm">
            {image.title ? <span>{image.title}</span> : null}
            {images.length > 1 ? (
              <span className="text-foreground-secondary font-mono">
                {index + 1} / {images.length}
              </span>
            ) : null}
          </figcaption>
        </figure>
      </div>
    </Dialog.Root>
  );
};
