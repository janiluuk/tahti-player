import type { Meta, StoryObj } from '@storybook/react-vite';
import { GovernanceMeetingDetailView } from '@tahti-web/views/GovernanceMeetingDetailView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GovernanceMeetingDetailView> = {
  title: 'Tahti/Governance/GovernanceMeetingDetailView',
  component: GovernanceMeetingDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One governance meeting (`/governance/meetings/$id`) for members: type and state, schedule, location with the remote link, notice and minutes status, quorum and attendance, and the agenda with what was decided under each item. Signed out it asks for a cooperative membership login.',
      },
    },
  },
  args: { id: 'meeting-board-2026-06' },
  decorators: [withTahtiRouter('/governance/meetings/meeting-board-2026-06')],
  render: (args) => (
    <div className="p-6">
      <GovernanceMeetingDetailView {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ApprovedBoardMeeting: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', {
        level: 1,
        name: 'June 2026 board meeting',
      }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Overview' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Quorum & attendance' }),
    ).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'Agenda' })).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Join remotely/ }),
    ).toHaveAttribute('href', 'https://meet.tahti.live/board-2026-06');
    await expect(canvas.getByRole('link', { name: /Download/ })).toBeVisible();
    await expect(
      await canvas.findByText('2. Annual report 2025'),
    ).toBeVisible();
    await expect(
      canvas.getByText('Decided: Approved unanimously.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Approve the annual report' }),
    ).toHaveAttribute('href', '/governance/motions/motion-1');
  },
};

export const NotFound: Story = {
  args: { id: 'meeting-does-not-exist' },
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Meeting not found.')).toBeVisible();
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Meeting' }),
    ).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(
        'Sign in with a cooperative membership account to view meeting records.',
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Governance' }),
    ).toHaveAttribute('href', '/governance');
    await expect(
      canvas.queryByRole('heading', { name: 'Overview' }),
    ).not.toBeInTheDocument();
  },
};
