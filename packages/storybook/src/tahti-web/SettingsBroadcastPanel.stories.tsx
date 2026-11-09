import type { Meta, StoryObj } from '@storybook/react-vite';
import { BroadcastPanel } from '@tahti-web/views/settings/panels/BroadcastPanel';
import { expect, within } from 'storybook/test';

import { resetSettingsModal } from './_fixtures/settings';
import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, selectTab } from './_lib/play';

const meta: Meta<typeof BroadcastPanel> = {
  title: 'Tahti/Settings/BroadcastPanel',
  component: BroadcastPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Broadcast: Radio (announcements, offline fallback and auto-enrolling new archive), Green room (open it on go-live and who gets invited) and Multistream. A switch shows its new value at once and goes back, with a toast, when the save fails.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/settings/broadcast'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Radio: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Radio' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expectVisible(
      await canvas.findByText(/managed in Studio → Broadcast → Schedule/),
    );
    await expect(
      canvas.queryByRole('switch', { name: 'Announcements enabled' }),
    ).toBeNull();
    await expect(
      canvas.getByRole('link', { name: /Open schedule/ }),
    ).toHaveAttribute('href', '/studio/schedule');
  },
};

export const GreenRoom: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Green room');
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Open the green room when I go live',
      }),
    );
    await expectVisible(canvas.getByText('Moderators and fan subscribers'));
    await expectVisible(canvas.getByText('Only people I invite'));
  },
};

export const Multistream: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Multistream');
    await expect(
      canvas.getByRole('link', { name: 'Manage live destinations' }),
    ).toHaveAttribute('href', '/studio/go-live?tab=destinations');
  },
};

export const OneSection: Story = {
  args: { section: 'green-room' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Open the green room when I go live',
      }),
    );
    await expect(canvas.queryByRole('tab')).toBeNull();
  },
};
