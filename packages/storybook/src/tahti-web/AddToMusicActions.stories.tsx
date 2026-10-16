import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddToMusicActions } from '@tahti-web/components/AddToMusicActions';
import { expect, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AddToMusicActions> = {
  title: 'Tahti/Studio/AddToMusicActions',
  component: AddToMusicActions,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/music')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const UploadHint: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.hover(canvas.getByRole('button', { name: 'Upload' }));
    await expect(
      await within(document.body).findByRole('tooltip'),
    ).toHaveTextContent('Library → Upload');
  },
};

export const Centered: Story = {
  args: {
    align: 'center',
  },
};

export const Compact: Story = {
  args: {
    size: 'sm',
    align: 'start',
  },
};
