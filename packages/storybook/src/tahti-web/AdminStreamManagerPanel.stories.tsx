import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminStreamManagerPanel } from '@tahti-web/components/AdminStreamManagerPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof AdminStreamManagerPanel> = {
  title: 'Tahti/Admin/AdminStreamManagerPanel',
  component: AdminStreamManagerPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/admin/streams'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const LiveStreams: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Live streams (2)' }),
    ).toBeVisible();
    const toggle = canvas.getByRole('button', { name: 'Expand live streams' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole('button', { name: 'Collapse live streams' }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
};
