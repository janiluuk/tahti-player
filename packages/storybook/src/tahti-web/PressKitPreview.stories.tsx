import type { Meta, StoryObj } from '@storybook/react-vite';
import { PressKitPreview } from '@tahti-web/views/studio/branding/PressKitPreview';

const meta: Meta<typeof PressKitPreview> = {
  title: 'Tahti/Studio/Branding/PressKitPreview',
  component: PressKitPreview,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    displayName: 'Northern Lights',
    bio: 'Ambient and downtempo from Helsinki.',
    images: [
      {
        id: 'i1',
        imageUrl: '/mock/northern-lights/cover-first-light.svg',
        title: null,
        position: 0,
        includeInZip: true,
      },
    ],
  },
};

export const NoImagesNoBio: Story = {
  args: { displayName: 'DJ Moonlight', bio: null, images: [] },
};
