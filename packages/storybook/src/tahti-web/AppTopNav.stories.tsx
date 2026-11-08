import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppTopNav } from '@tahti-web/components/AppTopNav';
import { useNotificationInboxStore } from '@tahti-web/stores/notificationInboxStore';
import { expect, userEvent, waitFor, within } from 'storybook/test';

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

export const MobileStableChrome: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

type Canvas = ReturnType<typeof within>;

async function openFromAccountMenu(
  canvas: Canvas,
  account: RegExp,
  item: string,
) {
  await userEvent.click(canvas.getByRole('button', { name: account }));
  const menu = within(await canvas.findByRole('menu'));
  await userEvent.click(menu.getByRole('menuitem', { name: item }));
  return within(await canvas.findByRole('menu'));
}

/** Notifications and messages live in the account menu; the avatar carries
 * one coloured dot per kind with something unread, never a count. */
export const AccountUnreadPill: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: 'Notifications' }),
    ).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Messages' })).toBeNull();
    const trigger = await canvas.findByRole('button', {
      name: 'Signed in as Northern Lights, unread notifications and messages',
    });
    const pill = within(trigger).getByTestId('account-unread-pill');
    await expect(pill).toBeVisible();
    await expect(pill.children).toHaveLength(2);
    await expect(trigger.textContent).not.toMatch(/[0-9]/);
  },
};

/** Sticky "Needs acknowledgement" row and a read row. */
export const NotificationsOpen: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: /unread notifications/ });
    const menu = await openFromAccountMenu(
      canvas,
      /^Signed in as Northern Lights/,
      'Notifications',
    );
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
    const menu = await openFromAccountMenu(
      canvas,
      /^Signed in as Northern Lights/,
      'Messages',
    );
    const artist = await menu.findByRole('menuitem', {
      name: /Midnight Cartography/,
    });
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
    const menu = await openFromAccountMenu(
      canvas,
      /^Signed in as Liina/,
      'Messages',
    );
    await expect(menu.getByText('No messages yet.')).toBeVisible();
  },
};

/** Opening one quick view closes the other. */
export const PopoversAreExclusive: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const account = /^Signed in as Northern Lights/;
    await openFromAccountMenu(canvas, account, 'Notifications');
    await expect(canvas.getByText('Board vote closes tonight')).toBeVisible();
    await openFromAccountMenu(canvas, account, 'Messages');
    await waitFor(() =>
      expect(canvas.queryByText('Board vote closes tonight')).toBeNull(),
    );
    await expect(canvas.getAllByRole('menu')).toHaveLength(1);
  },
};

export const UserMenuArtist: Story = {
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', {
      name: /^Signed in as Northern Lights/,
    });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const menu = within(await canvas.findByRole('menu'));
    await expect(menu.getByText('@northern-lights')).toBeVisible();
    for (const item of [
      'Notifications',
      'Messages',
      'Studio',
      'My artist profile',
      'Settings',
      'tahti.live (opens in a new tab)',
      'Log out',
    ]) {
      await expect(menu.getByRole('menuitem', { name: item })).toBeVisible();
    }
    await userEvent.click(trigger);
    await waitFor(() => expect(canvas.queryByRole('menu')).toBeNull());
  },
};

/** Listeners have no channel, so no Studio / My artist profile entries. */
export const UserMenuListener: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /^Signed in as Liina/ }),
    );
    const menu = within(await canvas.findByRole('menu'));
    await expect(
      menu.getByRole('menuitem', { name: 'Settings' }),
    ).toBeVisible();
    await expect(menu.queryByRole('menuitem', { name: 'Studio' })).toBeNull();
  },
};
