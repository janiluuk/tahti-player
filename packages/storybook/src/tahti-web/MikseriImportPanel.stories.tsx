import type { Meta, StoryObj } from '@storybook/react-vite';
import { MikseriImportPanel } from '@tahti-web/views/studio/collection-edit/MikseriImportPanel';
import { fn } from 'storybook/test';

const meta: Meta<typeof MikseriImportPanel> = {
  title: 'Tahti/Studio/CollectionEdit/MikseriImportPanel',
  component: MikseriImportPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    collectionId: 'collection-1',
    onAdded: fn(),
    onUndoAdd: fn(async () => ({ ok: true as const })),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
