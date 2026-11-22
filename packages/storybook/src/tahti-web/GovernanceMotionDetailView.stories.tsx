import type { Meta, StoryObj } from '@storybook/react-vite';
import { GovernanceMotionDetailView } from '@tahti-web/views/GovernanceMotionDetailView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GovernanceMotionDetailView> = {
  title: 'Tahti/Governance/GovernanceMotionDetailView',
  component: GovernanceMotionDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One governance motion (`/governance/motions/$id`) for members: the expanded motion card with description, vote buttons while voting is open, the meeting it was taken up at and its seconders. Board members also get the meeting / agenda-item link controls and Open voting / Close & publish result. Signed out it asks for a cooperative membership login.',
      },
    },
  },
  args: { id: 'motion-1' },
  decorators: [withTahtiRouter('/governance/motions/motion-1')],
  render: (args) => (
    <div className="p-6">
      <GovernanceMotionDetailView {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenMotion: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: 'Approve 2026 grant formula',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByText(/Approves the 2026 grant funding formula/),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Yes' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'No' })).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: '2026 Annual General Meeting' }),
    ).toHaveAttribute('href', '/governance/meetings/meeting-agm-2026');
    await expect(
      canvas.queryByRole('button', { name: 'Close & publish result' }),
    ).not.toBeInTheDocument();
  },
};

export const Board: Story = {
  decorators: [withMockAuth(MOCK_USERS.board)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: 'Approve 2026 grant formula',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Close & publish result' }),
    ).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        'Sign in with a cooperative membership account to view this motion.',
      ),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Log in' })).toBeVisible();
    await expect(
      canvas.queryByText(/Approves the 2026 grant funding formula/),
    ).not.toBeInTheDocument();
  },
};
