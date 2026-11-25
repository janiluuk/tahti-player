import type { Meta, StoryObj } from '@storybook/react-vite';
import { GallerySection } from '@tahti-web/views/studio/branding/GallerySection';
import { PressKitSection } from '@tahti-web/views/studio/branding/PressKitSection';
import { usePressKit } from '@tahti-web/views/studio/branding/usePressKit';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

function Gallery() {
  return <GallerySection kit={usePressKit()} />;
}

function PressKit() {
  return <PressKitSection kit={usePressKit()} />;
}

const meta: Meta = {
  title: 'Tahti/Settings/Artist branding sections',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Settings → Artist: the gallery and press kit sections, each driven by the shared usePressKit() state. The profile picture and backdrop live in the Identity header (`ProfileIdentityHeader`).',
      },
    },
  },
  decorators: [
    withTahtiRouter('/settings/artist'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj;

export const GalleryStory: Story = {
  name: 'Gallery',
  render: () => <Gallery />,
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole('heading', { name: 'Gallery' }),
    ).toBeVisible();
  },
};

export const PressKitStory: Story = {
  name: 'Press kit',
  render: () => <PressKit />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Press kit story' }),
    ).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Photos' })).toBeVisible();
  },
};
