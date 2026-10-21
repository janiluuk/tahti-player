import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioUpdatesView } from '@tahti-web/views/studio/StudioUpdatesView';
import { expect, userEvent, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findToast, withinBody } from './_lib/play';

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
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NewsletterSendConfirmation: Story = {
  name: 'Newsletter send confirmation (mock toast)',
  args: { tab: 'newsletter' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const send = await canvas.findByRole('button', { name: /^Send$/ });
    await userEvent.click(send);
    const body = withinBody(canvasElement);
    const confirm = await body.findByRole('button', {
      name: 'Send newsletter',
    });
    await expect(confirm).toBeVisible();
    await userEvent.click(confirm);
    await findToast(canvasElement, /Queued send to \d+ subscribers/);
    await expectNoDialog(canvasElement);
  },
};
