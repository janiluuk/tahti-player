import type { Meta, StoryObj } from '@storybook/react-vite';
import { setMockSessionUser } from '@tahti-web/api/mock-session';
import type { AuthUser } from '@tahti-web/api/types';
import { ChannelSetupDialog } from '@tahti-web/components/ChannelSetupDialog';
import { useAuthStore } from '@tahti-web/stores/authStore';
import { useChannelSetupModalStore } from '@tahti-web/stores/channelSetupModalStore';
import { expect, userEvent, within } from 'storybook/test';

import {
  channelDesignMockData,
  restoreChannelDesignState,
} from './_fixtures/channel-design';
import { MOCK_USERS, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog, withinBody } from './_lib/play';

const ARTIST_WITHOUT_CHANNEL: AuthUser = {
  ...MOCK_USERS.artist,
  channel: undefined,
};

/** Seeds the signed-in user (store + mock session) and opens the modal. */
function seedSetup(user: AuthUser, sessionUser: AuthUser | null = user) {
  setMockSessionUser(sessionUser);
  useAuthStore.setState({
    user,
    profileLoaded: true,
    hydrated: true,
    loading: false,
  });
  useChannelSetupModalStore.setState({ isOpen: true });
  const restoreDesign = restoreChannelDesignState();
  return async () => {
    useChannelSetupModalStore.setState({ isOpen: false });
    setMockSessionUser(null);
    await restoreDesign();
  };
}

/** First-run "Create your channel" modal; after provisioning it turns into
 * the "Design your channel" step with the real ChannelDesigner inside. */
const meta: Meta<typeof ChannelSetupDialog> = {
  title: 'Tahti/Channel/Designer/ChannelSetupDialog',
  component: ChannelSetupDialog,
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/settings/artist')],
  parameters: { mockData: channelDesignMockData() },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateThenDesign: Story = {
  name: 'Create channel, then design it',
  beforeEach: () => seedSetup(ARTIST_WITHOUT_CHANNEL),
  play: async ({ canvasElement }) => {
    const create = await findDialog(canvasElement, 'Create your channel');
    await expect(
      create.getByText(/Create northern-lights\.tahti\.live to unlock/),
    ).toBeVisible();
    await userEvent.click(
      create.getByRole('button', {
        name: 'Create northern-lights.tahti.live',
      }),
    );

    const design = await findDialog(canvasElement, 'Design your channel');
    await expect(
      await design.findByRole('main', { name: 'Channel page preview' }),
    ).toBeVisible();
    await expect(
      design.getByRole('button', { name: 'More options' }),
    ).toBeVisible();
    await expect(useAuthStore.getState().user?.channel?.slug).toBe(
      'northern-lights',
    );
    await userEvent.click(design.getByRole('button', { name: 'Finish setup' }));
    await expectNoDialog(canvasElement);
  },
};

export const ProvisionError: Story = {
  name: 'Provisioning fails',
  beforeEach: () => seedSetup(ARTIST_WITHOUT_CHANNEL, null),
  play: async ({ canvasElement }) => {
    const create = await findDialog(canvasElement, 'Create your channel');
    await userEvent.click(
      create.getByRole('button', {
        name: 'Create northern-lights.tahti.live',
      }),
    );
    await expect(await create.findByRole('alert')).toHaveTextContent(
      'Log in first to create a channel.',
    );
    await userEvent.click(create.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};

export const AlreadyHasChannel: Story = {
  name: 'Already has a channel (renders nothing)',
  beforeEach: () => seedSetup(MOCK_USERS.artist),
  play: async ({ canvasElement }) => {
    await expect(withinBody(canvasElement).queryByRole('dialog')).toBeNull();
    await expect(
      within(canvasElement).queryByText('Create your channel'),
    ).toBeNull();
  },
};
