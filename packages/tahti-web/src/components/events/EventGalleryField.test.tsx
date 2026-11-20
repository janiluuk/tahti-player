import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArtistEventGalleryImage } from '../../api/events';
import { uploadUserMediaFile } from '../../api/user-media';
import { toastWithUndo } from '../../lib/undoToast';
import { EventGalleryField } from './EventGalleryField';

vi.mock('../../api/user-media', () => ({ uploadUserMediaFile: vi.fn() }));
vi.mock('../../lib/undoToast', () => ({ toastWithUndo: vi.fn() }));

const upload = vi.mocked(uploadUserMediaFile);
const undoToast = vi.mocked(toastWithUndo);

function image(n: number, caption = ''): ArtistEventGalleryImage {
  return { url: `https://cdn.example/${n}.jpg`, caption };
}

let latest: ArtistEventGalleryImage[] = [];

function Harness({
  initial = [],
  onUploadingChange,
}: {
  initial?: ArtistEventGalleryImage[];
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [value, setValue] = useState(initial);
  latest = value;
  return (
    <EventGalleryField
      value={value}
      onChange={setValue}
      seed="evt-1"
      onUploadingChange={onUploadingChange}
    />
  );
}

function pick(...names: string[]) {
  const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
  fireEvent.change(input, {
    target: {
      files: names.map((name) => new File(['x'], name, { type: 'image/jpeg' })),
    },
  });
}

function captionInputs() {
  return screen.getAllByLabelText(/^Caption for image/) as HTMLInputElement[];
}

describe('EventGalleryField', () => {
  beforeEach(() => {
    upload.mockImplementation(async (file: File) => ({
      ok: true,
      data: {
        id: file.name,
        filename: file.name,
        contentType: 'image/jpeg',
        sizeBytes: 1,
        url: `https://cdn.example/${file.name}`,
        createdAt: '2026-11-20T00:00:00.000Z',
      },
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uploads every picked file and adds each with an empty caption', async () => {
    const uploading = vi.fn();
    render(<Harness onUploadingChange={uploading} />);
    pick('a.jpg', 'b.jpg');
    await waitFor(() => expect(latest).toHaveLength(2));
    expect(latest).toEqual([
      { url: 'https://cdn.example/a.jpg', caption: '' },
      { url: 'https://cdn.example/b.jpg', caption: '' },
    ]);
    expect(captionInputs().map((input) => input.value)).toEqual(['', '']);
    expect(captionInputs()[0]!.maxLength).toBe(300);
    expect(uploading).toHaveBeenCalledWith(true);
    expect(uploading).toHaveBeenLastCalledWith(false);
  });

  it('shows a failed upload with its error until dismissed', async () => {
    upload.mockResolvedValueOnce({ ok: false, error: 'Too large' });
    render(<Harness />);
    pick('big.jpg');
    expect(
      await screen.findByText('big.jpg did not upload: Too large'),
    ).toBeTruthy();
    expect(latest).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/did not upload/)).toBeNull();
  });

  it('edits a caption', () => {
    render(<Harness initial={[image(1), image(2)]} />);
    fireEvent.change(captionInputs()[1]!, { target: { value: 'Encore' } });
    expect(latest).toEqual([image(1), image(2, 'Encore')]);
  });

  it('moves images up and down', () => {
    render(<Harness initial={[image(1), image(2), image(3)]} />);
    expect(
      screen.getByRole('button', { name: 'Move image 1 up' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Move image 3 down' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Move image 1 down' }));
    expect(latest).toEqual([image(2), image(1), image(3)]);
    fireEvent.click(screen.getByRole('button', { name: 'Move image 3 up' }));
    expect(latest).toEqual([image(2), image(3), image(1)]);
  });

  it('removes an image and puts it back on undo', async () => {
    render(<Harness initial={[image(1), image(2, 'Two'), image(3)]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove image 2' }));
    expect(latest).toEqual([image(1), image(3)]);
    expect(undoToast).toHaveBeenCalledWith(
      'Image removed from the gallery',
      expect.objectContaining({ undoneMessage: 'Image restored' }),
    );
    const { undo } = undoToast.mock.calls[0]![1];
    await act(async () => {
      expect(await undo()).toEqual({ ok: true });
    });
    expect(latest).toEqual([image(1), image(2, 'Two'), image(3)]);
  });

  it('uploads only up to 30 images and says why', async () => {
    const initial = Array.from({ length: 29 }, (_, i) => image(i));
    render(<Harness initial={initial} />);
    pick('a.jpg', 'b.jpg', 'c.jpg');
    await waitFor(() => expect(latest).toHaveLength(30));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('The gallery holds at most 30 images.'),
    ).toBeTruthy();
    expect(
      document.querySelector<HTMLInputElement>('input[type=file]')!.disabled,
    ).toBe(true);
    expect(screen.getByText('30 / 30 images')).toBeTruthy();
  });
});
