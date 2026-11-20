import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { FC, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, ImageReveal, Tooltip } from '@tahti-player/ui';

import { PageEmpty } from './PageStates';

export type LightboxImage = {
  imageUrl: string;
  title?: string | null;
  /** Shown under the image and used as alt text; falls back to `title`. */
  caption?: string | null;
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

export const WHEEL_STEP_MS = 300;
const WHEEL_THRESHOLD_PX = 30;
const WHEEL_IDLE_RESET_MS = 200;
const SWIPE_MIN_PX = 50;
const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 400;

function wheelDeltaPx(event: WheelEvent): number {
  const delta =
    Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
  if (event.deltaMode === 1) {
    return delta * LINE_HEIGHT_PX;
  }
  if (event.deltaMode === 2) {
    return delta * PAGE_HEIGHT_PX;
  }
  return delta;
}

/** Wheel / trackpad scroll steps one image per gesture: deltas add up until
 * they pass a threshold, then further events are swallowed for
 * `WHEEL_STEP_MS` so a trackpad flick's inertia tail does not skip ahead. */
function useWheelStep(
  node: HTMLElement | null,
  enabled: boolean,
  onStep: (direction: -1 | 1) => void,
) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    if (!node || !enabled) {
      return;
    }
    let accumulated = 0;
    let lastEventAt = -Infinity;
    let lastStepAt = -Infinity;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const now = Date.now();
      if (now - lastEventAt > WHEEL_IDLE_RESET_MS) {
        accumulated = 0;
      }
      lastEventAt = now;
      if (now - lastStepAt < WHEEL_STEP_MS) {
        return;
      }
      accumulated += wheelDeltaPx(event);
      if (Math.abs(accumulated) < WHEEL_THRESHOLD_PX) {
        return;
      }
      onStepRef.current(accumulated > 0 ? 1 : -1);
      accumulated = 0;
      lastStepAt = now;
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [node, enabled]);
}

export const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  index,
  label,
  onIndexChange,
  onClose,
  onDeleteCurrent,
}) => {
  const { t } = useTranslation('web');
  // State, not a ref: the dialog portal mounts the panel after the first
  // effects run, and the wheel listener must attach once it exists.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const image = images[index];
  const canNavigate = images.length > 1 && Boolean(onIndexChange);

  const move = (direction: -1 | 1) => {
    if (!canNavigate || !onIndexChange) {
      return;
    }
    onIndexChange((index + direction + images.length) % images.length);
  };

  useWheelStep(panel, canNavigate, move);

  useEffect(() => {
    panel?.focus();
  }, [panel, index]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = {
      ArrowLeft: 'previous',
      PageUp: 'previous',
      ArrowRight: 'next',
      PageDown: 'next',
      Home: 'first',
      End: 'last',
    }[event.key];
    if (!target || !onIndexChange) {
      return;
    }
    event.preventDefault();
    if (target === 'previous') {
      move(-1);
    } else if (target === 'next') {
      move(1);
    } else {
      onIndexChange(target === 'first' ? 0 : images.length - 1);
    }
  };

  if (!image) {
    return (
      <Dialog.Root
        isOpen
        onClose={onClose}
        showCloseButton={false}
        aria-label={label}
        className="max-w-md border-transparent bg-transparent p-0 shadow-none"
      >
        <div
          ref={setPanel}
          tabIndex={-1}
          className="relative px-6 pt-8 pb-4 outline-none"
        >
          <div className="absolute top-0 right-0 z-10 flex gap-1">
            <Tooltip content={t('tooltips.close')} side="top">
              <Button
                size="icon-sm"
                variant="secondary"
                aria-label={t('imageLightbox.closeImageViewer')}
                onClick={onClose}
              >
                <XIcon size={18} aria-hidden />
              </Button>
            </Tooltip>
          </div>
          <PageEmpty
            title={t('empties.noPhotosToShow')}
            description={t('empties.thisGalleryIsEmpty')}
          />
        </div>
      </Dialog.Root>
    );
  }

  const caption = image.caption || image.title || '';

  return (
    <Dialog.Root
      isOpen
      fullScreen
      onClose={onClose}
      showCloseButton={false}
      aria-label={label}
      className="bg-black/95 shadow-none"
    >
      <div
        ref={setPanel}
        tabIndex={-1}
        data-testid="image-lightbox"
        className="relative flex h-full w-full flex-col outline-none"
        onKeyDown={onKeyDown}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current = touch
            ? { x: touch.clientX, y: touch.clientY }
            : null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          const touch = event.changedTouches[0];
          touchStart.current = null;
          if (!start || !touch) {
            return;
          }
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) {
            move(dx < 0 ? 1 : -1);
          }
        }}
      >
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          {onDeleteCurrent ? (
            <Tooltip content={t('tooltips.removePhoto')} side="bottom">
              <Button
                size="icon-sm"
                variant="secondary"
                className="text-accent-red-strong"
                aria-label={t('imageLightbox.removePhoto')}
                onClick={onDeleteCurrent}
              >
                <Trash2Icon
                  className="text-accent-red-strong"
                  size={18}
                  aria-hidden
                />
              </Button>
            </Tooltip>
          ) : null}
          <Tooltip content={t('tooltips.close')} side="bottom">
            <Button
              size="icon-sm"
              variant="secondary"
              aria-label={t('imageLightbox.closeImageViewer')}
              onClick={onClose}
            >
              <XIcon size={18} aria-hidden />
            </Button>
          </Tooltip>
        </div>
        {canNavigate ? (
          <>
            <Tooltip content={t('tooltips.previousImage')} side="right">
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute top-1/2 left-3 z-10 -translate-y-1/2"
                aria-label={t('imageLightbox.previousImage')}
                onClick={() => move(-1)}
              >
                <ChevronLeftIcon size={20} aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip content={t('tooltips.nextImage')} side="left">
              <Button
                size="icon-sm"
                variant="secondary"
                className="absolute top-1/2 right-3 z-10 -translate-y-1/2"
                aria-label={t('imageLightbox.nextImage')}
                onClick={() => move(1)}
              >
                <ChevronRightIcon size={20} aria-hidden />
              </Button>
            </Tooltip>
          </>
        ) : null}
        <figure className="flex h-full min-h-0 w-full flex-col items-center gap-3 px-4 pt-14 pb-4 sm:px-16">
          <div
            key={index}
            className="motion-safe:animate-in motion-safe:fade-in flex min-h-0 w-full flex-1 items-center justify-center motion-safe:duration-200"
          >
            <ImageReveal
              src={image.imageUrl}
              alt={caption}
              loading="eager"
              className="h-full w-full"
              imgClassName="h-full w-full object-contain"
            />
          </div>
          <figcaption
            aria-live="polite"
            className="flex max-w-3xl flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-center text-sm text-white"
          >
            {caption ? <span className="break-words">{caption}</span> : null}
            {images.length > 1 ? (
              <span className="font-mono text-white/70">
                {index + 1} / {images.length}
              </span>
            ) : null}
          </figcaption>
        </figure>
      </div>
    </Dialog.Root>
  );
};
