import type { Meta, StoryObj } from '@storybook/react-vite';
import { StashFilesPanel } from '@tahti-web/components/StashFilesPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findToast } from './_lib/play';

const meta: Meta<typeof StashFilesPanel> = {
  title: 'Tahti/Studio/StashFilesPanel',
  component: StashFilesPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withToaster(), withTahtiRouter('/studio/stash'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="max-w-xl">
      <StashFilesPanel />
    </div>
  ),
};

export const ShareRoundTrip: Story = {
  name: 'Share create / revoke (mock toast + list)',
  render: () => (
    <div className="max-w-xl">
      <StashFilesPanel />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('stems-kick.wav');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Share stems-kick.wav' }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Grant access' }));
    await findToast(canvasElement, 'Created access for stems-kick.wav');
    await waitFor(() => expect(canvas.getByText('Link access')).toBeVisible());
    await userEvent.click(
      canvas.getByRole('button', { name: 'Revoke access for link' }),
    );
    await findToast(canvasElement, 'Share access revoked.');
    await waitFor(() => expect(canvas.queryByText('Link access')).toBeNull());
  },
};
