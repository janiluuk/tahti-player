import type { Meta, StoryObj } from '@storybook/react-vite';
import { BroadcastPanel } from '@tahti-web/views/settings/panels/BroadcastPanel';
import { expect, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof BroadcastPanel> = {
  title: 'Tahti/Settings/BroadcastPanel',
  component: BroadcastPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Green room and multistream defaults, shown as sections of Studio → Broadcast → Channel. Settings has no Broadcast section: `/settings/broadcast?tab=` links go to Channel, and the recording switches are on the Recordings page. A switch shows its new value at once and goes back, with a toast, when the save fails.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/studio/channel'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GreenRoom: Story = {
  args: { section: 'green-room' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Open the green room when I go live',
      }),
    );
    await expectVisible(canvas.getByText('Moderators and fan subscribers'));
    await expectVisible(canvas.getByText('Only people I invite'));
    await expect(canvas.queryByRole('tab')).toBeNull();
  },
};

export const Multistream: Story = {
  args: { section: 'multistream' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: 'Manage live destinations' }),
    ).toHaveAttribute('href', '/studio/go-live?step=destinations');
  },
};
