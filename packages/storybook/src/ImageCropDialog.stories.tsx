import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { Button, ImageCropDialog } from '@tahti-player/ui';

import { findDialog } from './tahti-web/_lib/play';

const createSampleImage = (
  width: number,
  height: number,
  type: 'image/png' | 'image/jpeg',
) =>
  new Promise<File>((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('2d canvas unavailable'));
      return;
    }
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#ffd93d');
    gradient.addColorStop(1, '#4d96ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#000';
    ctx.font = 'bold 96px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SAMPLE', width / 2, height / 2);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not encode sample image'));
        return;
      }
      const ext = type === 'image/png' ? 'png' : 'jpg';
      resolve(new File([blob], `sample.${ext}`, { type }));
    }, type);
  });

const labels = {
  title: 'Crop banner',
  zoom: 'Zoom',
  cancel: 'Cancel',
  confirm: 'Use image',
  description: 'Drag to move the image, use the slider to zoom.',
};

type StoryArgs = {
  aspect: number;
  outputWidth: number;
  sourceType: 'image/png' | 'image/jpeg';
  sourceWidth: number;
  sourceHeight: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
};

const CropDemo = ({
  aspect,
  outputWidth,
  sourceType,
  sourceWidth,
  sourceHeight,
  onCrop,
  onCancel,
}: StoryArgs) => {
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createSampleImage(sourceWidth, sourceHeight, sourceType).then(
      (next) => {
        if (!cancelled) {
          setFile(next);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [sourceWidth, sourceHeight, sourceType]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={() => setIsOpen(true)}>Crop sample image</Button>
      {result && (
        <p className="text-foreground-secondary text-sm" data-testid="result">
          {result}
        </p>
      )}
      <ImageCropDialog
        isOpen={isOpen}
        file={file}
        aspect={aspect}
        outputWidth={outputWidth}
        labels={labels}
        onCancel={() => {
          onCancel();
          setIsOpen(false);
        }}
        onCrop={(blob) => {
          onCrop(blob);
          setResult(`${blob.type}, ${Math.round(blob.size / 1024)} KB`);
          setIsOpen(false);
        }}
      />
    </div>
  );
};

const meta = {
  title: 'Components/ImageCropDialog',
  component: CropDemo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    aspect: 3,
    outputWidth: 1800,
    sourceType: 'image/png',
    sourceWidth: 1200,
    sourceHeight: 800,
    onCrop: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof CropDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Banner: Story = {
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Crop banner');
    const confirm = dialog.getByRole('button', { name: 'Use image' });
    await waitFor(() => expect(confirm).toBeEnabled(), { timeout: 5_000 });
    dialog.getByRole('group', { name: 'Crop banner' }).focus();
    await userEvent.keyboard('{ArrowLeft}{ArrowUp}');
    await userEvent.click(confirm);
    await waitFor(() => expect(args.onCrop).toHaveBeenCalledTimes(1));
    const blob = (args.onCrop as ReturnType<typeof fn>).mock
      .calls[0][0] as Blob;
    await expect(blob.type).toBe('image/png');
  },
};

export const JpegPortraitSource: Story = {
  args: {
    sourceType: 'image/jpeg',
    sourceWidth: 800,
    sourceHeight: 1200,
  },
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Crop banner');
    const confirm = dialog.getByRole('button', { name: 'Use image' });
    await waitFor(() => expect(confirm).toBeEnabled(), { timeout: 5_000 });
    await userEvent.click(confirm);
    await waitFor(() => expect(args.onCrop).toHaveBeenCalledTimes(1));
    const blob = (args.onCrop as ReturnType<typeof fn>).mock
      .calls[0][0] as Blob;
    await expect(blob.type).toBe('image/jpeg');
  },
};

export const Square: Story = {
  args: { aspect: 1, outputWidth: 600 },
  play: async ({ canvasElement, args }) => {
    const dialog = await findDialog(canvasElement, 'Crop banner');
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expect(args.onCancel).toHaveBeenCalledTimes(1);
  },
};
