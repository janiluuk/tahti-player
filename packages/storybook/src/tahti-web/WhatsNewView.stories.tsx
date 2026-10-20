import type { Meta, StoryObj } from '@storybook/react-vite';
import { WhatsNewView } from '@tahti-web/views/WhatsNewView';
import { expect, userEvent, within } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

const meta: Meta<typeof WhatsNewView> = {
  title: 'Tahti/App/WhatsNewView',
  component: WhatsNewView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTahtiRouter('/whats-new'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <WhatsNewView />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: "What's New" }),
    ).toBeVisible();
    await expect(canvas.getByText(/7–20 Oct 2026/)).toBeVisible();
    const openFull = await canvas.findByRole('button', {
      name: /Read full update for 7–20 Oct 2026/i,
    });
    await userEvent.click(openFull);
    // findDialog already returns within(dialog)
    const dialog = await findDialog(canvasElement);
    await expect(dialog.getByText(/MusicBrainz registration/i)).toBeVisible();
  },
};
