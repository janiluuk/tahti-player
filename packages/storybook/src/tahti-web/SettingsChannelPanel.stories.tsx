import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelPanel } from '@tahti-web/views/settings/panels/ChannelPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectNoDialog, expectVisible, openDialog } from './_lib/play';

const meta: Meta<typeof ChannelPanel> = {
  title: 'Tahti/Settings/ChannelPanel',
  component: ChannelPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One channel page form per Studio → Profile page: Channel design (`appearance`, the Channel Designer, whose own stories live under Tahti/Channel Designer), How fans find you (`discovery`: share button and the rest of how the channel is found), Address and domain (`domain`: slug availability, rename with a confirm, custom domain). Chat and moderators are in Studio → Fans; old `/settings/channel?tab=` links redirect.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/studio/profile/discovery'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Discovery: Story = {
  args: { section: 'discovery' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('tab')).toBeNull();
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show share button on my channel',
      }),
    );
  },
};

// Rename is disabled until the slug changes, and asks before renaming.
export const RenameChannel: Story = {
  args: { section: 'domain' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slug = await canvas.findByRole('textbox', {
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

export const SignedOut: Story = {
  args: { section: 'discovery' },
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expectVisible(
      within(canvasElement).getByText(
        'Sign in with a channel to edit design and discovery.',
      ),
    );
  },
};
