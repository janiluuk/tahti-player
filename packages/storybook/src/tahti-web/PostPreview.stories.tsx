import type { Meta, StoryObj } from '@storybook/react-vite';
import { PostPreview } from '@tahti-web/views/studio/updates/PostPreview';

const meta: Meta<typeof PostPreview> = {
  title: 'Tahti/Studio/Updates/PostPreview',
  component: PostPreview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TextOnly: Story = {
  args: {
    title: 'New EP is out',
    body: 'Thanks for listening — the EP is live everywhere today.',
    images: [],
  },
};

export const WithImagesAndDate: Story = {
  args: {
    title: 'Studio update',
    body: 'A few shots from the session.',
    publishAt: '2026-09-25T18:00:00Z',
    images: [
      '/mock/northern-lights/cover-first-light.svg',
      '/mock/dj-moonlight/avatar.svg',
    ],
    onImageClick: () => {},
  },
};

export const Untitled: Story = {
  args: { title: null, body: 'No title.', images: [] },
};
