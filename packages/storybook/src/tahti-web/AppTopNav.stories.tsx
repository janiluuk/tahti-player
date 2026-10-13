import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppTopNav } from '@tahti-web/components/AppTopNav';
import { useNotificationInboxStore } from '@tahti-web/stores/notificationInboxStore';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { CHROME_CONVERSATIONS, CHROME_NOTIFICATIONS } from './_fixtures/chrome';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof AppTopNav> = {
  title: 'Tahti/Chrome/AppTopNav',
  component: AppTopNav,
  parameters: {
    layout: 'fullscreen',
    mockData: mockData({
      conversations: CHROME_CONVERSATIONS,
      notifications: (_base, inbox) => (inbox ? CHROME_NOTIFICATIONS : []),
    }),
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="min-h-[28rem]">
        <Story />
      </div>
    ),
    withTahtiRouter('/'),
  ],
  // The inbox normally fills from NotificationToasts' polling, which isn't
  // mounted here; load it once through the real (mocked) fetch instead.
  beforeEach: async () => {
    const inbox = useNotificationInboxStore.getState();
    inbox.reset();
    await inbox.load({ toastNew: false });
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Notifications' }),
    ).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Messages' })).toBeNull();
  },
};

export const SignedInListener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
};

export const SignedInArtist: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

export const SignedInArtistWithMenu: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  args: {
    showMenuButton: true,
    onOpenMenu: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    await expect(args.onOpenMenu).toHaveBeenCalledOnce();
  },
};

export const SignedOutWithMenu: Story = {
  decorators: [withMockAuth(null)],
  args: {
    showMenuButton: true,
    onOpenMenu: fn(),
  },
};

export const MobileStableChrome: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  args: {
    showMenuButton: true,
    onOpenMenu: fn(),
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** Unread count on the bell, sticky "Needs acknowledgement" row, read row. */
export const NotificationsOpen: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bell = canvas.getByRole('button', { name: 'Notifications' });
    await waitFor(() => expect(within(bell).getByText('2')).toBeVisible());
    await userEvent.click(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    const menu = within(await canvas.findByRole('menu'));
    await expect(menu.getByText('Board vote closes tonight')).toBeVisible();
    await expect(menu.getByText('Needs acknowledgement')).toBeVisible();
    await expect(menu.getByText('New fan')).toBeVisible();
    await expect(menu.getByText('Your event is coming up')).toBeVisible();
    await expect(
      menu.getByRole('button', { name: 'Acknowledge' }),
    ).toBeVisible();
  },
};

/** DMs from channel staff carry a DmRoleBadge (Artist / Moderator). */
export const MessagesOpen: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Messages' });
    await userEvent.click(button);
    const menu = within(await canvas.findByRole('menu'));
    const artist = await menu.findByRole('menuitem', {
      name: /Midnight Cartography/,
    });
    // Conversations load when the popover opens; the unread total then
    // shows on the trigger too.
    await expect(within(button).getByText('2')).toBeVisible();
    await expect(within(artist).getByText('Artist')).toBeVisible();
    await expect(within(artist).getByText('2')).toBeVisible();
    const moderator = menu.getByRole('menuitem', { name: /Kaamos Crew/ });
    await expect(within(moderator).getByText('Moderator')).toBeVisible();
    const listener = menu.getByRole('menuitem', { name: /Liina/ });
    await expect(within(listener).queryByText('Artist')).toBeNull();
    await expect(within(listener).queryByText('Moderator')).toBeNull();
    await expect(
      menu.getByRole('menuitem', { name: 'Open all' }),
    ).toBeVisible();
  },
};

export const MessagesEmpty: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: { mockData: mockData({ conversations: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Messages' }));
    const menu = within(await canvas.findByRole('menu'));
    await expect(menu.getByText('No messages yet.')).toBeVisible();
  },
};

/** Opening one popover closes the other. */
export const PopoversAreExclusive: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bell = canvas.getByRole('button', { name: 'Notifications' });
    const messages = canvas.getByRole('button', { name: 'Messages' });
    await userEvent.click(bell);
    await expect(bell).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(messages);
    await expect(messages).toHaveAttribute('aria-expanded', 'true');
    await expect(bell).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getAllByRole('menu')).toHaveLength(1);
  },
};

export const UserMenuArtist: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: 'Signed in as Northern Lights',
    });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = within(await canvas.findByRole('menu'));
    await expect(menu.getByText('@northern-lights')).toBeVisible();
    for (const item of [
      'Artist panel',
      'My channel',
      'Settings',
      'tahti.live',
      'Log out',
    ]) {
      await expect(menu.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await userEvent.click(trigger);
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
  },
};

/** Listeners have no channel, so no Artist panel / My channel entries. */
export const UserMenuListener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Signed in as Liina' }),
    );
    const menu = within(await canvas.findByRole('menu'));
    await expect(
      menu.getByRole('menuitem', { name: 'Settings' }),
    ).toBeVisible();
    await expect(
      menu.queryByRole('menuitem', { name: 'Artist panel' }),
    ).toBeNull();
  },
};
