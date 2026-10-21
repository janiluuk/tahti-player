import { Meta, StoryObj } from '@storybook/react-vite';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import {
  ImageThumbnailPicker,
  ImageThumbnailPickerItem,
} from '@tahti-player/ui';

const meta = {
  title: 'Components/ImageThumbnailPicker',
  component: ImageThumbnailPicker,
  tags: ['autodocs'],
} satisfies Meta<typeof ImageThumbnailPicker>;

export default meta;

type Story = StoryObj<typeof ImageThumbnailPicker>;

const slots: ImageThumbnailPickerItem[] = [
  {
    id: 'default',
    imageUrl: 'https://picsum.photos/seed/a/200',
    label: 'Default',
  },
  {
    id: 'single',
    imageUrl: 'https://picsum.photos/seed/b/200',
    label: 'Single',
  },
  { id: 'ep', imageUrl: 'https://picsum.photos/seed/c/200', label: 'EP' },
  { id: 'album', imageUrl: 'https://picsum.photos/seed/d/200', label: 'Album' },
];

const pool: ImageThumbnailPickerItem[] = [
  { id: 'p1', imageUrl: 'https://picsum.photos/seed/e/100' },
  { id: 'p2', imageUrl: 'https://picsum.photos/seed/f/100' },
  { id: 'p3', imageUrl: 'https://picsum.photos/seed/g/100' },
];

export const Interactive: Story = {
  render: () => {
    const [slot, setSlot] = useState('default');
    const [poolSelected, setPoolSelected] = useState<string | null>(null);

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Grid layout — labeled slots
          </h3>
          <ImageThumbnailPicker
            items={slots}
            selected={slot}
            onSelect={setSlot}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">
            Inline layout — compact pool picker with an upload tile
          </h3>
          <ImageThumbnailPicker
            items={pool}
            selected={poolSelected}
            onSelect={setPoolSelected}
            layout="inline"
            trailingAction={
              <button
                type="button"
                aria-label="Upload a new artwork"
                className="border-border text-foreground-secondary flex size-12 items-center justify-center rounded-md border border-dashed"
              >
                <PlusIcon size={16} aria-hidden />
              </button>
            }
          />
        </div>
      </div>
    );
  },
};
