import type { Meta, StoryObj } from '@storybook/react-vite';
import { GovernanceView } from '@tahti-web/views/GovernanceView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GovernanceView> = {
  title: 'Tahti/Governance/GovernanceView',
  component: GovernanceView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Co-op governance home (`/governance`): quick links, open motions to vote on, top feature-request topics, published meetings, documents, quarterly reviews, the member directory preview and the motion draft form. Board members also get Open voting / Close controls on each motion. Signed out it asks for a cooperative membership login.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance')],
  render: () => (
    <div className="p-6">
      <GovernanceView />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Member: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { level: 1, name: 'Governance' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('heading', { name: 'Needs your attention' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Top topics' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Crossfade between archive tracks'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'June 2026 board meeting' }),
    ).toHaveAttribute('href', '/governance/meetings/meeting-board-2026-06');
    await expect(
      canvas.getByRole('link', { name: 'Approve 2026 grant formula' }),
    ).toHaveAttribute('href', '/governance/motions/motion-1');
    await expect(
      canvas.getByRole('textbox', { name: 'Motion title' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Submit draft' }),
    ).toBeDisabled();
    await expect(
      canvas.queryByRole('button', { name: 'Open voting' }),
    ).not.toBeInTheDocument();
  },
};

export const Board: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', {
        name: 'Adopt a code of conduct for chat moderation',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Open voting' }),
    ).toBeVisible();
    await expect(
      canvas.getAllByRole('button', { name: 'Close & publish result' }),
    ).toHaveLength(2);
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        'Sign in with a cooperative membership account to vote.',
      ),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(
      canvas.queryByRole('heading', { name: 'Needs your attention' }),
    ).not.toBeInTheDocument();
  },
};
