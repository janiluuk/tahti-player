import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioUpdatesView } from '@tahti-web/views/studio/StudioUpdatesView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findToast, selectTab } from './_lib/play';

const meta: Meta<typeof StudioUpdatesView> = {
  title: 'Tahti/Studio/StudioUpdatesView',
  component: StudioUpdatesView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Updates: posts and newsletters. Renders against the mock API layer.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/studio/updates'),
    withMockAuth(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewsletterSendConfirmation: Story = {
  name: 'Newsletter send confirmation (mock toast)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Newsletter');
    const send = await canvas.findByRole('button', { name: /^Send\b/ });
    await userEvent.click(send);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Send newsletter' }),
    );
    await findToast(canvasElement, /Queued send to \d+ subscribers/);
    await waitFor(() =>
      expect(canvas.queryByText('Send newsletter')).toBeNull(),
    );
  },
};
