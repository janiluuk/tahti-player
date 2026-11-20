import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clampCenter,
  clampZoom,
  coverScale,
  cropSize,
  outputSize,
  panCenter,
  sourceRect,
} from './cropMath';
import { ImageCropDialog, ImageCropDialogProps } from './ImageCropDialog';

const labels = {
  title: 'Crop banner',
  zoom: 'Zoom',
  cancel: 'Cancel',
  confirm: 'Use image',
  description: 'Drag to choose the visible area.',
};

const file = new File(['x'], 'banner.png', { type: 'image/png' });

const renderDialog = (props: Partial<ImageCropDialogProps> = {}) =>
  render(
    <ImageCropDialog
      isOpen
      file={file}
      aspect={3}
      outputWidth={1800}
      labels={labels}
      onCancel={vi.fn()}
      onCrop={vi.fn()}
      {...props}
    />,
  );

const loadImage = (width: number, height: number) => {
  const img = screen
    .getByTestId('image-crop-frame')
    .querySelector('img') as HTMLImageElement;
  Object.defineProperty(img, 'naturalWidth', { value: width });
  Object.defineProperty(img, 'naturalHeight', { value: height });
  fireEvent.load(img);
};

describe('ImageCropDialog', () => {
  const createObjectURL = vi.fn(() => 'blob:banner');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  it('renders every label', () => {
    renderDialog();
    expect(screen.getByText('Crop banner')).toBeInTheDocument();
    expect(
      screen.getByText('Drag to choose the visible area.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Crop banner' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Use image' }),
    ).toBeInTheDocument();
  });

  it('disables Confirm until the image has loaded', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Use image' })).toBeDisabled();
    loadImage(1200, 800);
    expect(screen.getByRole('button', { name: 'Use image' })).toBeEnabled();
  });

  it('calls onCancel from the Cancel button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('creates an object URL for the file and revokes it on unmount', () => {
    const { unmount } = renderDialog();
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:banner');
  });

  it('revokes the previous object URL when the file changes', () => {
    const { rerender } = renderDialog();
    const next = new File(['y'], 'other.jpg', { type: 'image/jpeg' });
    rerender(
      <ImageCropDialog
        isOpen
        file={next}
        aspect={3}
        outputWidth={1800}
        labels={labels}
        onCancel={vi.fn()}
        onCrop={vi.fn()}
      />,
    );
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:banner');
    expect(createObjectURL).toHaveBeenLastCalledWith(next);
  });
});

describe('cropMath', () => {
  const landscape = { width: 1200, height: 800 };
  const portrait = { width: 600, height: 900 };

  it('clamps zoom to 1..3', () => {
    expect(clampZoom(0.5)).toBe(1);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(5)).toBe(3);
  });

  it('computes the cover scale from the tighter axis', () => {
    expect(coverScale(landscape, { width: 600, height: 200 })).toBe(0.5);
    expect(coverScale(portrait, { width: 300, height: 300 })).toBe(0.5);
    expect(
      coverScale({ width: 100, height: 100 }, { width: 300, height: 100 }),
    ).toBe(3);
  });

  it('uses the full width when the image is taller than the frame aspect', () => {
    expect(cropSize(landscape, 3, 1)).toEqual({ width: 1200, height: 400 });
  });

  it('uses the full height when the image is wider than the frame aspect', () => {
    expect(cropSize({ width: 3000, height: 500 }, 3, 1)).toEqual({
      width: 1500,
      height: 500,
    });
  });

  it('shrinks the crop by the zoom factor and caps it at 3x', () => {
    expect(cropSize(landscape, 3, 2)).toEqual({ width: 600, height: 200 });
    expect(cropSize(landscape, 3, 10)).toEqual({ width: 400, height: 400 / 3 });
  });

  it('keeps the crop centre inside the image', () => {
    const crop = { width: 600, height: 200 };
    expect(clampCenter({ x: 0, y: 0 }, landscape, crop)).toEqual({
      x: 300,
      y: 100,
    });
    expect(clampCenter({ x: 5000, y: 5000 }, landscape, crop)).toEqual({
      x: 900,
      y: 700,
    });
    expect(clampCenter({ x: 500, y: 400 }, landscape, crop)).toEqual({
      x: 500,
      y: 400,
    });
  });

  it('pins the centre on an axis the crop fully covers', () => {
    expect(
      clampCenter({ x: 0, y: 0 }, landscape, { width: 1200, height: 400 }),
    ).toEqual({ x: 600, y: 200 });
  });

  it('returns the centred source rect at cover zoom', () => {
    expect(sourceRect(landscape, 3, 1, { x: 600, y: 400 })).toEqual({
      x: 0,
      y: 200,
      width: 1200,
      height: 400,
    });
  });

  it('returns a clamped source rect for an out-of-range pan', () => {
    expect(sourceRect(landscape, 3, 1, { x: 0, y: 10_000 })).toEqual({
      x: 0,
      y: 400,
      width: 1200,
      height: 400,
    });
    expect(sourceRect(landscape, 3, 2, { x: 10_000, y: -10 })).toEqual({
      x: 600,
      y: 0,
      width: 600,
      height: 200,
    });
  });

  it('keeps every source rect inside the image', () => {
    for (const zoom of [1, 1.5, 2.25, 3]) {
      for (const center of [
        { x: -100, y: -100 },
        { x: 600, y: 400 },
        { x: 2000, y: 2000 },
      ]) {
        const r = sourceRect(portrait, 3, zoom, center);
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(portrait.width + 1e-9);
        expect(r.y + r.height).toBeLessThanOrEqual(portrait.height + 1e-9);
        expect(r.width / r.height).toBeCloseTo(3);
      }
    }
  });

  it('pans opposite to the drag, in image pixels', () => {
    const crop = { width: 600, height: 200 };
    expect(
      panCenter({ x: 600, y: 400 }, 50, -20, 0.5, landscape, crop),
    ).toEqual({ x: 500, y: 440 });
  });

  it('clamps a pan at the image edge', () => {
    const crop = { width: 600, height: 200 };
    expect(
      panCenter({ x: 600, y: 400 }, 10_000, 10_000, 1, landscape, crop),
    ).toEqual({ x: 300, y: 100 });
  });

  it('derives the output size from width and aspect', () => {
    expect(outputSize(1800, 3)).toEqual({ width: 1800, height: 600 });
    expect(outputSize(1000, 16 / 9)).toEqual({ width: 1000, height: 563 });
  });
});
