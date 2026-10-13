import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioBrandingView } from '@tahti-web/views/studio/StudioBrandingView';
import { expect, waitFor, within } from 'storybook/test';

import { resetSettingsModal, WithSettingsModal } from './_fixtures/settings';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectVisible, findDialog } from './_lib/play';

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof StudioBrandingView> = {
  title: 'Tahti/Studio/StudioBrandingView',
  component: StudioBrandingView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/studio/branding` has no page of its own: it opens Settings → Artist on the Visuals group, landing on Branding (profile picture, backdrop, logo), Gallery or Press kit from `?tab=`. `?tab=channel-designer` opens Settings → Channel & chat instead.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  render: () => (
    <WithSettingsModal>
      <StudioBrandingView />
    </WithSettingsModal>
  ),
  decorators: [withMockAuth(MOCK_USERS.artist)],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectSelectedTab(scope: Scope, name: string) {
  await waitFor(() =>
    expect(scope.getByRole('tab', { name })).toHaveAttribute(
      'aria-selected',
      'true',
    ),
  );
}

export const Branding: Story = {
  decorators: [withTahtiRouter('/studio/branding')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectVisible(
      dialog.getByRole('heading', { level: 1, name: 'Artist' }),
    );
    await expectSelectedTab(dialog, 'Visuals');
    await expectSelectedTab(dialog, 'Branding');
    await expectVisible(
      await dialog.findByRole('heading', { name: 'Profile picture' }),
    );
    await expectVisible(
      dialog.getByRole('heading', { name: 'Profile backdrop' }),
    );
    await expectVisible(dialog.getByRole('heading', { name: 'Logo' }));
  },
};

export const Gallery: Story = {
  decorators: [withTahtiRouter('/studio/branding?tab=gallery')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSelectedTab(dialog, 'Gallery');
    await expectVisible(
      await dialog.findByRole('heading', { name: 'Gallery' }),
    );
    await expectVisible(dialog.getByRole('switch', { name: 'Public gallery' }));
  },
};

export const PressKit: Story = {
  decorators: [withTahtiRouter('/studio/branding?tab=press-kit')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectSelectedTab(dialog, 'Press kit');
    await expectVisible(
      await dialog.findByRole('heading', { name: 'Press kit story' }),
    );
    await expectVisible(
      dialog.getByRole('heading', { name: 'Press kit preview' }),
    );
  },
};

export const ChannelDesigner: Story = {
  decorators: [withTahtiRouter('/studio/branding?tab=channel-designer')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement);
    await expectVisible(
      await dialog.findByRole('heading', { level: 1, name: 'Channel & chat' }),
    );
  },
};
