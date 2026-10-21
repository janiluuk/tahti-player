import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewDraftDialog } from '@tahti-web/views/studio/updates/NewDraftDialog';

const meta: Meta<typeof NewDraftDialog> = {
  title: 'Tahti/Studio/Updates/NewDraftDialog',
  component: NewDraftDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onClose: () => {}, onSaved: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
