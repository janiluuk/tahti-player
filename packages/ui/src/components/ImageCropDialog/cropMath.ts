export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type Rect = Point & Size;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const clampZoom = (zoom: number) => clamp(zoom, MIN_ZOOM, MAX_ZOOM);

/** Scale at which the image just covers the frame (zoom 1). */
export const coverScale = (image: Size, frame: Size) =>
  Math.max(frame.width / image.width, frame.height / image.height);

/** Size in image pixels of the region the frame shows at `zoom`. */
export const cropSize = (image: Size, aspect: number, zoom: number): Size => {
  const z = clampZoom(zoom);
  const width = Math.min(image.width, image.height * aspect);
  return { width: width / z, height: width / aspect / z };
};

/** Keeps the crop centre far enough from the edges that no empty area shows. */
export const clampCenter = (center: Point, image: Size, crop: Size): Point => ({
  x: clamp(center.x, crop.width / 2, image.width - crop.width / 2),
  y: clamp(center.y, crop.height / 2, image.height - crop.height / 2),
});

/** Source rectangle in image pixels for a crop centre and zoom. */
export const sourceRect = (
  image: Size,
  aspect: number,
  zoom: number,
  center: Point,
): Rect => {
  const size = cropSize(image, aspect, zoom);
  const c = clampCenter(center, image, size);
  return {
    x: c.x - size.width / 2,
    y: c.y - size.height / 2,
    width: size.width,
    height: size.height,
  };
};

/**
 * Moves the crop centre by a drag of (`dx`, `dy`) frame pixels, where
 * `scale` is frame pixels per image pixel. Dragging the image right
 * reveals more of its left side, so the centre moves the opposite way.
 */
export const panCenter = (
  center: Point,
  dx: number,
  dy: number,
  scale: number,
  image: Size,
  crop: Size,
): Point =>
  clampCenter(
    { x: center.x - dx / scale, y: center.y - dy / scale },
    image,
    crop,
  );

export const outputSize = (outputWidth: number, aspect: number): Size => ({
  width: Math.round(outputWidth),
  height: Math.round(outputWidth / aspect),
});
