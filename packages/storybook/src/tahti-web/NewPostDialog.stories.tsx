import type { Meta, StoryObj } from '@storybook/react-vite';
import { NewPostDialog } from '@tahti-web/views/studio/updates/NewPostDialog';

const meta: Meta<typeof NewPostDialog> = {
  title: 'Tahti/Studio/Updates/NewPostDialog',
  component: NewPostDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onClose: () => {}, onPublished: () => {}, onImageClick: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
