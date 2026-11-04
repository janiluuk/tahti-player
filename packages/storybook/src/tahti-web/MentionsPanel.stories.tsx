import type { Meta, StoryObj } from '@storybook/react-vite';
import { MentionsPanel } from '@tahti-web/views/settings/panels/MentionsPanel';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof MentionsPanel> = {
  title: 'Tahti/Settings/MentionsPanel',
  component: MentionsPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Settings → Account → Mentions: allow mentions, show on profile, recent mentions list, and mute controls. Fixtures come from `me-mentions` force-mock.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withPageSurface(),
    withTahtiRouter('/settings/account'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        name: /^Mentions$|^Maininnat$/,
      }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('link', { name: /aurora/i }),
    ).toBeInTheDocument();
  },
};
