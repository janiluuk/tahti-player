import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioBroadcastView } from '@tahti-web/views/studio/StudioBroadcastView';
import { StudioChatView } from '@tahti-web/views/studio/StudioChatView';
import { StudioFansView } from '@tahti-web/views/studio/StudioFansView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Studio/Hubs',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio sections that are hubs instead of a second row of tabs: **Broadcast** (on/off air, Go live, stream manager, one agenda of shows, events and parties, and tool cards) and **Fans** (hub cards, including Chat, which opens its own page at `/studio/chat`) Each card opens a focused page. Profile and Channel use a row of sub-tabs instead (see StudioProfileSectionView and StudioChannelView).',
      },
    },
  },
  decorators: [withPageSurface(), withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj;

export const Fans: Story = {
  decorators: [withTahtiRouter('/studio/fans')],
  render: () => <StudioFansView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: /^Fans$|^Fanit$/ }),
    ).toBeInTheDocument();
    await expect(canvas.queryByRole('tab')).toBeNull();
    const links = within(
      canvas.getByRole('list', { name: /^Fans tools$|^Fanityökalut$/ }),
    ).getAllByRole('link');
    await expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/studio/updates',
      '/studio/updates?tab=newsletter',
      '/studio/chat',
      '/studio/audience?tab=tiers',
      '/studio/audience?tab=store',
      '/studio/audience',
    ]);
    await expect(
      canvas.queryByRole('heading', {
        name: /^Recent messages$|^Viimeisimmät viestit$/,
      }),
    ).toBeNull();
  },
};

export const Chat: Story = {
  decorators: [withTahtiRouter('/studio/chat')],
  render: () => <StudioChatView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: /^Chat$/ }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('tab', { name: /^Messages$|^Viestit$/ }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(
      canvas.getByRole('heading', {
        name: /^Recent messages$|^Viimeisimmät viestit$/,
      }),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('tab', { name: /^Moderators$|^Moderaattorit$/ }),
    );
    await expect(
      await canvas.findByRole('heading', {
        name: /^Channel moderators$|^Kanavan moderaattorit$/,
      }),
    ).toBeInTheDocument();
  },
};

export const Broadcast: Story = {
  decorators: [withTahtiRouter('/studio/broadcast')],
  render: () => <StudioBroadcastView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Broadcast' }),
    ).toBeInTheDocument();
    await expect(canvas.getByTestId('broadcast-air-banner')).toHaveTextContent(
      /Off air|On air/,
    );
    await expect(
      canvas.getByRole('heading', { name: 'Stream Manager' }),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('broadcast-stream-manager'),
    ).toBeInTheDocument();
    await expect(
      canvas.getByTestId('stream-manager-playback-toggle'),
    ).toHaveAttribute('aria-pressed', 'false');
    await expect(
      canvas.queryByRole('heading', { name: 'Channel manager' }),
    ).not.toBeInTheDocument();
    const agenda = await canvas.findByRole('list', { name: 'Coming up' });
    const all = within(agenda).getAllByTestId('broadcast-agenda-row').length;
    await userEvent.click(canvas.getByRole('radio', { name: 'Events' }));
    await expect(
      canvas.queryAllByTestId('broadcast-agenda-row').length,
    ).toBeLessThanOrEqual(all);
    const tools = within(
      canvas.getByRole('list', { name: 'Broadcast tools' }),
    ).getAllByRole('link');
    await expect(tools.map((link) => link.textContent)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('24/7 radio'),
        expect.stringContaining('Recordings'),
        expect.stringContaining('Tahti Radio'),
      ]),
    );
  },
};
