// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { firstFramePng } from './gifPoster';

describe('firstFramePng', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('draws the first frame onto a canvas and encodes it as PNG', async () => {
    const bitmap = { width: 40, height: 30, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const png = new Blob(['png'], { type: 'image/png' });
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(png));

    const gif = new Blob(['gif'], { type: 'image/gif' });
    await expect(firstFramePng(gif)).resolves.toBe(png);
    expect(createImageBitmap).toHaveBeenCalledWith(gif);
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
    expect(toBlob.mock.calls[0]![1]).toBe('image/png');
    expect(bitmap.close).toHaveBeenCalled();
  });

  it('rejects when the browser cannot decode images', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    await expect(firstFramePng(new Blob(['gif']))).rejects.toThrow();
  });

  it('rejects when the canvas cannot encode the frame', async () => {
    const bitmap = { width: 1, height: 1, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (callback) => callback(null),
    );
    await expect(firstFramePng(new Blob(['gif']))).rejects.toThrow(
      'Could not draw the first frame',
    );
    expect(bitmap.close).toHaveBeenCalled();
  });
});
