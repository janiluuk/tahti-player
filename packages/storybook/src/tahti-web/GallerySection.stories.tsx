import type { Meta, StoryObj } from '@storybook/react-vite';
import type { PressKitImageItem } from '@tahti-web/api/artist-settings';
import { uploadPressKitImages } from '@tahti-web/api/artist-settings';
import { GallerySection } from '@tahti-web/views/studio/branding/GallerySection';
import type { PressKitState } from '@tahti-web/views/studio/branding/usePressKit';
import { useMemo, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { findDialog } from './_lib/play';

const INITIAL_IMAGES: PressKitImageItem[] = [
  {
    id: 'gallery-1',
    imageUrl: '/mock/northern-lights/cover-first-light.svg',
    title: 'Stage lights',
    position: 0,
    includeInZip: true,
  },
  {
    id: 'gallery-2',
    imageUrl: '/mock/northern-lights/cover-polar-static.svg',
    title: 'Polar session',
    position: 1,
    includeInZip: false,
  },
  {
    id: 'gallery-3',
    imageUrl: '/mock/northern-lights/cover-first-light.svg',
    title: 'Crowd',
    position: 2,
    includeInZip: true,
  },
];

function useMockGalleryKit(initialUploadOpen = false): PressKitState {
  const [images, setImages] = useState(INITIAL_IMAGES);
  const [galleryPublic, setGalleryPublic] = useState(true);
  const [galleryUploadOpen, setGalleryUploadOpen] = useState(initialUploadOpen);
  const [selectedGalleryFiles, setSelectedGalleryFiles] = useState<File[]>([]);
  const [uploadMode, setUploadMode] = useState<'append' | 'replace'>('append');
  const [includeUploads, setIncludeUploads] = useState(true);
  const [busy, setBusy] = useState(false);

  return useMemo(
    () =>
      ({
        images,
        setImages,
        galleryPublic,
        setVisibility: async (nextPublic: boolean) => {
          setGalleryPublic(nextPublic);
        },
        setGalleryUploadOpen,
        galleryUploadOpen,
        busy,
        setSelectedGalleryFiles,
        selectedGalleryFiles,
        uploadMode,
        setUploadMode,
        uploadGallery: async (files: readonly File[]) => {
          if (files.length === 0) {
            return;
          }
          setBusy(true);
          try {
            const uploaded = await uploadPressKitImages(Array.from(files));
            if (uploaded.images.length > 0) {
              setImages((current) => [...current, ...uploaded.images]);
              setSelectedGalleryFiles([]);
              setGalleryUploadOpen(false);
            }
          } finally {
            setBusy(false);
          }
        },
        includeUploads,
        setIncludeUploads,
      }) as unknown as PressKitState,
    [
      busy,
      galleryPublic,
      galleryUploadOpen,
      images,
      includeUploads,
      selectedGalleryFiles,
      uploadMode,
    ],
  );
}

function GalleryDemo({ uploadOpen = false }: { uploadOpen?: boolean }) {
  const kit = useMockGalleryKit(uploadOpen);
  return (
    <div className="max-w-2xl">
      <GallerySection kit={kit} />
    </div>
  );
}

const meta: Meta<typeof GallerySection> = {
  title: 'Tahti/Studio/Branding/GallerySection',
  component: GallerySection,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OwnerGallery: Story = {
  name: 'Owner gallery (reorder)',
  render: () => <GalleryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Gallery' })).toBeVisible(),
    );
    await expect(
      canvas.getByRole('switch', { name: 'Public gallery' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Upload more gallery images' }),
    ).toBeVisible();
  },
};

export const UploadDialog: Story = {
  name: 'Upload dialog (mock API)',
  render: () => <GalleryDemo uploadOpen />,
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, 'Upload gallery images');
    await expect(
      dialog.getByRole('radiogroup', { name: 'Gallery upload mode' }),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole('radio', { name: 'Replace' }));
    await expect(
      dialog.getByRole('radio', { name: 'Replace' }),
    ).toHaveAttribute('aria-checked', 'true');
  },
};
