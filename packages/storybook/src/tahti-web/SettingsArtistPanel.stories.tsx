import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistPanel } from '@tahti-web/views/settings/panels/ArtistPanel';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { resetSettingsModal } from './_fixtures/settings';
import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible, findToast, selectTab } from './_lib/play';

type Scope = ReturnType<typeof within>;

const meta: Meta<typeof ArtistPanel> = {
  title: 'Tahti/Settings/ArtistPanel',
  component: ArtistPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Settings → Artist, in three groups: Profile (identity, story, and people for a band or collective), Links & press (social connections, news feed, auto-post; press kit) and Visuals (branding, gallery, release visual defaults). Signed out it only links to sign-in.',
      },
    },
  },
  beforeEach: resetSettingsModal,
  decorators: [
    withPageSurface(),
    withToaster(),
    withTahtiRouter('/settings/artist'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function openGroup(scope: Scope, group: string, tab: string) {
  await selectTab(scope, group);
  // Group and tab can share a name; the group's panel holds the tab row.
  const panel = scope.getAllByRole('tabpanel')[0]!;
  await selectTab(within(panel), tab);
}

export const Identity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('tab', { name: 'Identity' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Display name' }),
    ).toHaveValue('Demo Artist');
    await expectVisible(canvas.getByRole('group', { name: 'Creative roles' }));
    // A solo artist has no People tab.
    await expect(canvas.queryByRole('tab', { name: 'People' })).toBeNull();
  },
};

export const SaveIdentity: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tipJar = await canvas.findByRole('textbox', { name: 'Tip jar URL' });
    await userEvent.clear(tipJar);
    await userEvent.type(tipJar, 'https://ko-fi.example/demo');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save identity' }),
    );
    await findToast(canvasElement, 'Artist info saved.');
  },
};

export const StoryTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('textbox', { name: 'Display name' });
    await selectTab(canvas, 'Story');
    await expect(
      await canvas.findByRole('textbox', { name: 'Short bio' }),
    ).toHaveValue('Mock bio for Nuclear studio channel settings.');
    await expectVisible(canvas.getByRole('button', { name: 'Save story' }));
  },
};

export const Connections: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openGroup(canvas, 'Links & press', 'Connections');
    await expectVisible(
      await canvas.findByRole('button', { name: 'Save social links' }),
    );
  },
};

export const ReleaseVisuals: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await openGroup(canvas, 'Visuals', 'Releases');
    await waitFor(() =>
      expect(canvas.getByText('New release background')).toBeVisible(),
    );
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(canvas.getByRole('button', { name: 'Sign in' }));
    await expectVisible(canvas.getByText(/to edit artist profile/));
  },
};
