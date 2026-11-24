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
          'One channel page form per Studio → Channel tab: Design (`design`, the Channel Designer, whose own stories live under Tahti/Channel Designer), Visibility (`visibility`: share button, genres and the rest of how the channel is found), Address (`address`: channel address with availability check and a confirmed rename, then the custom domain). Chat and moderators are in Studio → Fans; old `/settings/channel?tab=` links redirect.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/studio/channel/visibility'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Visibility: Story = {
  args: { section: 'visibility' },
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
  args: { section: 'address' },
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
  args: { section: 'visibility' },
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    await expectVisible(
      within(canvasElement).getByText(
        'Sign in with a channel to edit design and discovery.',
      ),
    );
  },
};
