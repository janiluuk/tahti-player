import {
  FC,
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '../Button';
import { Dialog } from '../Dialog';
import { Slider } from '../Slider';
import {
  clampCenter,
  clampZoom,
  cropSize,
  MAX_ZOOM,
  MIN_ZOOM,
  outputSize,
  panCenter,
  Point,
  Size,
  sourceRect,
} from './cropMath';

export type ImageCropDialogLabels = {
  title: string;
  zoom: string;
  cancel: string;
  confirm: string;
  description?: string;
};

export type ImageCropDialogProps = {
  isOpen: boolean;
  file: File | null;
  /** Width / height of the crop frame, e.g. 3 for a 3:1 banner. */
  aspect: number;
  /** Output width in pixels; the height is `outputWidth / aspect`. */
  outputWidth: number;
  labels: ImageCropDialogLabels;
  onCancel: () => void;
  /** Receives a PNG for PNG sources, otherwise a JPEG. */
  onCrop: (blob: Blob) => void;
};

const KEY_PAN_STEP = 10;
const KEY_PAN_STEP_LARGE = 50;
const JPEG_QUALITY = 0.9;

const KEY_DIRECTIONS: Record<string, Point> = {
  ArrowLeft: { x: 1, y: 0 },
  ArrowRight: { x: -1, y: 0 },
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
};

const useObjectUrl = (file: File | null) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
};

const useElementWidth = () => {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!element) {
      return;
    }
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, width] as const;
};

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, JPEG_QUALITY),
  );

export const ImageCropDialog: FC<ImageCropDialogProps> = ({
  isOpen,
  file,
  aspect,
  outputWidth,
  labels,
  onCancel,
  onCrop,
}) => {
  const url = useObjectUrl(file);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(
    null,
  );
  const [setFrame, frameWidth] = useElementWidth();
  const [image, setImage] = useState<Size | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [center, setCenter] = useState<Point>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setImage(null);
    setZoom(MIN_ZOOM);
    setBusy(false);
  }, [url, isOpen]);

  const crop = image ? cropSize(image, aspect, zoom) : null;
  const rect = image ? sourceRect(image, aspect, zoom, center) : null;
  const scale = crop && frameWidth > 0 ? frameWidth / crop.width : 0;

  const pan = (dx: number, dy: number) => {
    if (!image || !crop || scale <= 0) {
      return;
    }
    setCenter((c) => panCenter(c, dx, dy, scale, image, crop));
  };

  const onZoomChange = (next: number) => {
    const z = clampZoom(next);
    setZoom(z);
    if (image) {
      setCenter((c) => clampCenter(c, image, cropSize(image, aspect, z)));
    }
  };

  const onImageLoad = () => {
    const el = imageRef.current;
    if (!el || !el.naturalWidth || !el.naturalHeight) {
      return;
    }
    const size = { width: el.naturalWidth, height: el.naturalHeight };
    setImage(size);
    setCenter({ x: size.width / 2, y: size.height / 2 });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!image) {
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) {
      return;
    }
    pan(e.clientX - drag.x, e.clientY - drag.y);
    dragRef.current = { ...drag, x: e.clientX, y: e.clientY };
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const direction = KEY_DIRECTIONS[e.key];
    if (!direction) {
      return;
    }
    e.preventDefault();
    const step = e.shiftKey ? KEY_PAN_STEP_LARGE : KEY_PAN_STEP;
    pan(direction.x * step, direction.y * step);
  };

  const onConfirm = async () => {
    const el = imageRef.current;
    if (!el || !image || !rect || !file) {
      return;
    }
    const out = outputSize(outputWidth, aspect);
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, out.width, out.height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      el,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      0,
      0,
      out.width,
      out.height,
    );
    setBusy(true);
    try {
      const blob = await toBlob(canvas, type);
      if (blob) {
        onCrop(blob);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onCancel} className="max-w-2xl">
      <Dialog.Title>{labels.title}</Dialog.Title>
      {labels.description && (
        <Dialog.Description>{labels.description}</Dialog.Description>
      )}
      <div
        ref={setFrame}
        role="group"
        aria-label={labels.title}
        tabIndex={0}
        data-testid="image-crop-frame"
        className="border-border bg-background-secondary focus-visible:ring-primary relative mt-4 w-full cursor-grab touch-none overflow-hidden rounded-md border-(length:--border-width) outline-none select-none focus-visible:ring-2 active:cursor-grabbing"
        style={{ aspectRatio: aspect }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        {url && (
          <img
            key={url}
            ref={imageRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={onImageLoad}
            className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
            style={
              image && rect && scale > 0
                ? {
                    width: image.width * scale,
                    height: image.height * scale,
                    transform: `translate(${-rect.x * scale}px, ${-rect.y * scale}px)`,
                  }
                : { visibility: 'hidden' }
            }
          />
        )}
      </div>
      <Slider
        className="mt-4"
        label={labels.zoom}
        min={MIN_ZOOM}
        max={MAX_ZOOM}
        step={0.01}
        value={zoom}
        onValueChange={onZoomChange}
        formatValue={(v) => `${Math.round(v * 100)}%`}
        showFooter={false}
        disabled={!image}
      />
      <Dialog.Actions>
        <Dialog.Close>{labels.cancel}</Dialog.Close>
        <Button disabled={!image || busy} onClick={() => void onConfirm()}>
          {labels.confirm}
        </Button>
      </Dialog.Actions>
    </Dialog.Root>
  );
};
