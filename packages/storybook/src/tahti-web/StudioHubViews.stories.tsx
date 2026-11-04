import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioBroadcastView } from '@tahti-web/views/studio/StudioBroadcastView';
import { StudioFansView } from '@tahti-web/views/studio/StudioFansView';
import { StudioProfileView } from '@tahti-web/views/studio/StudioProfileView';
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
          'Studio sections that are hubs instead of a second row of tabs: **Broadcast** (on/off air, Go live, channel manager, one agenda of shows, events and parties, and tool cards), **Fans** (posts, newsletter, memberships, store, earnings, plus live chat on the page) and **Profile** (artist profile and channel page settings). Each card opens a focused page.',
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
      await canvas.findByRole('heading', { name: 'Fans' }),
    ).toBeVisible();
    const links = within(
      canvas.getByRole('list', { name: 'Fans tools' }),
    ).getAllByRole('link');
    await expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/studio/updates',
      '/studio/updates?tab=newsletter',
      '/studio/audience?tab=tiers',
      '/studio/audience?tab=store',
      '/studio/audience',
    ]);
    await expect(canvas.getByRole('heading', { name: 'Chat' })).toBeVisible();
  },
};

export const Profile: Story = {
  decorators: [withTahtiRouter('/studio/profile')],
  render: () => <StudioProfileView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Profile' }),
    ).toBeVisible();
    const artist = within(
      canvas.getByRole('list', { name: 'Artist profile settings' }),
    ).getAllByRole('link');
    await expect(artist).toHaveLength(8);
    await expect(artist[0]).toHaveAttribute(
      'href',
      '/settings/artist?tab=identity',
    );
    const channel = within(
      canvas.getByRole('list', { name: 'Channel page settings' }),
    ).getAllByRole('link');
    await expect(channel[0]).toHaveTextContent('Channel design');
    const chat = channel.find((link) => /Chat/.test(link.textContent ?? ''));
    const moderators = channel.find((link) =>
      /Moderators/.test(link.textContent ?? ''),
    );
    await expect(chat).toBeDefined();
    await expect(moderators).toBeDefined();
    await expect(chat).toHaveAttribute('href', '/studio/fans');
    await expect(moderators).toHaveAttribute('href', '/studio/fans');
  },
};

export const Broadcast: Story = {
  decorators: [withTahtiRouter('/studio/broadcast')],
  render: () => <StudioBroadcastView />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Broadcast' }),
    ).toBeVisible();
    await expect(canvas.getByTestId('broadcast-air-banner')).toHaveTextContent(
      /Off air|On air/,
    );
    await expect(
      canvas.getByRole('heading', { name: 'Channel manager' }),
    ).toBeVisible();
    await expect(canvas.getByTestId('broadcast-channel-manager')).toBeVisible();
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
