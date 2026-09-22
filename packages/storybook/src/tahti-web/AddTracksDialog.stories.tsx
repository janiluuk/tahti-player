import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddTracksDialog } from '@tahti-web/views/studio/collection-edit/AddTracksDialog';

const meta: Meta<typeof AddTracksDialog> = {
  title: 'Tahti/Studio/CollectionEdit/AddTracksDialog',
  component: AddTracksDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: () => {},
    title: 'Add tracks to “Summer Mixes”',
    existingSoundIds: new Set(['s2']),
    addBusyId: null,
    isPreviewing: () => false,
    onPreview: () => {},
    onPause: () => {},
    onAdd: () => {},
    sounds: [
      {
        id: 's1',
        title: 'Aurora',
        status: 'READY',
        genre: 'Ambient',
        durationSec: 312,
      },
      {
        id: 's2',
        title: 'Already in collection',
        status: 'READY',
        durationSec: 200,
      },
      {
        id: 's3',
        title: 'Midnight Drive',
        status: 'READY',
        genre: 'Synthwave',
        durationSec: 254,
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Adding: Story = { args: { addBusyId: 's1' } };
export const NothingAvailable: Story = {
  args: { sounds: [], existingSoundIds: new Set() },
};
