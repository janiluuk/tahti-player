import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelPanel } from '@tahti-web/views/settings/panels/ChannelPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { resetSettingsModal } from './_fixtures/settings';
import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import {
  expectNoDialog,
  expectVisible,
  openDialog,
  selectTab,
} from './_lib/play';

const meta: Meta<typeof ChannelPanel> = {
  title: 'Tahti/Settings/ChannelPanel',
  component: ChannelPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Channel & chat: Channel Designer (its own stories live under Tahti/Channel Designer), Discovery (share button and the rest of how the channel is found), Username & domain (slug availability, rename with a confirm, custom domain). Chat and Moderators tabs point at Studio → Fans.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/settings/channel'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tabs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('tab', { name: 'Channel Designer' }),
    ).toHaveAttribute('aria-selected', 'true');
    for (const name of [
      'Discovery',
      'Username & domain',
      'Chat',
      'Moderators',
    ]) {
      await expectVisible(canvas.getByRole('tab', { name }));
    }
  },
};

export const Discovery: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Discovery');
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show share button on my channel',
      }),
    );
  },
};

// Rename is disabled until the slug changes, and asks before renaming.
export const RenameChannel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Username & domain');
    const slug = canvas.getByRole('textbox', {
      name: 'Channel slug / username',
    });
    await waitFor(() => expect(slug).toHaveValue('northern-lights'));
    await expect(canvas.getByRole('button', { name: 'Rename' })).toBeDisabled();

    await userEvent.clear(slug);
    await userEvent.type(slug, 'aurora-unit');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Check availability' }),
    );
    await expectVisible(await canvas.findByText('aurora-unit is available.'));

    const confirm = await openDialog(
      canvasElement,
      'Rename',
      'Rename your channel to aurora-unit?',
    );
    await userEvent.click(confirm.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
    await expectVisible(canvas.getByRole('textbox', { name: 'Custom domain' }));
  },
};

export const Chat: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Chat');
    await expectVisible(await canvas.findByText('Chat moved to Fans'));
    await expect(
      canvas.getByRole('link', { name: 'Open Fans chat' }),
    ).toHaveAttribute('href', '/studio/fans?tab=chat');
  },
};

export const Moderators: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await selectTab(canvas, 'Moderators');
    await expectVisible(await canvas.findByText('Moderators moved to Fans'));
    await expect(
      canvas.getByRole('link', { name: 'Open Fans chat' }),
    ).toHaveAttribute('href', '/studio/fans?tab=chat&section=moderators');
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expectVisible(
      within(canvasElement).getByText(
        'Sign in with a channel to edit design and discovery.',
      ),
    );
  },
};
