import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOCK_LISTENING_PARTY_IDS } from '@tahti-web/api/listening-parties-mock';
import { StudioListeningPartiesView } from '@tahti-web/views/studio/StudioListeningPartiesView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectVisible, findDialog, selectTab } from './_lib/play';

const meta: Meta<typeof StudioListeningPartiesView> = {
  title: 'Tahti/Studio/StudioListeningPartiesView',
  component: StudioListeningPartiesView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Broadcast → Listening parties: Upcoming and Past tabs with each party\'s release, state and start time; Reschedule and Cancel while a party has not started, Open for its public page, and "Schedule listening party" in the header.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/listening-parties'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: 'Reschedule Polar Static' }),
    ).toHaveAttribute(
      'href',
      `/studio/listening-parties/${MOCK_LISTENING_PARTY_IDS.scheduled}/edit`,
    );
    await expectVisible(canvas.getByText('Live'));
    await expect(
      canvas.getByRole('link', { name: 'Schedule listening party' }),
    ).toHaveAttribute('href', '/studio/listening-parties/new');
  },
};

export const Past: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Reschedule Polar Static' });
    await selectTab(canvas, 'Past');
    await expectVisible(await canvas.findByText('Forest Cover'));
    await expectVisible(canvas.getByText('Canceled'));
  },
};

export const ConfirmCancel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    (
      await canvas.findByRole('button', { name: 'Cancel Polar Static' })
    ).click();
    const dialog = await findDialog(
      canvasElement,
      'Cancel the Polar Static listening party?',
    );
    await expect(
      dialog.getByRole('button', { name: 'Cancel party' }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ myListeningParties: () => [] }) },
  play: async ({ canvasElement }) => {
    await expectVisible(
      await within(canvasElement).findByText('No listening parties scheduled'),
    );
  },
};
