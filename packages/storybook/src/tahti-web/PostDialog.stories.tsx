import type { Meta, StoryObj } from '@storybook/react-vite';
import { PostDialog } from '@tahti-web/views/studio/updates/PostDialog';

const meta: Meta<typeof PostDialog> = {
  title: 'Tahti/Studio/Updates/PostDialog',
  component: PostDialog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  args: { onClose: () => {}, onSaved: () => {}, onImageClick: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const EditScheduled: Story = {
  args: {
    post: {
      id: 'post-story',
      title: 'Tour dates',
      body: 'Autumn dates are up.',
      linkUrl: 'https://example.com/tour',
      linkLabel: 'Get tickets',
      images: [],
      publishAt: '2099-06-01T09:00:00.000Z',
      createdAt: '2026-10-01T09:00:00.000Z',
    },
  },
};
