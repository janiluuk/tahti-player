import type { Meta, StoryObj } from '@storybook/react-vite';
import { GovernanceMembersView } from '@tahti-web/views/GovernanceMembersView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GovernanceMembersView> = {
  title: 'Tahti/Governance/GovernanceMembersView',
  component: GovernanceMembersView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Co-op member directory (`/governance/members`): member and board counts, a name/username search and one row per member (board badge, member number, joining year; rows with a channel link to it). Signed out it asks for a cooperative membership login.',
      },
    },
  },
  decorators: [withTahtiRouter('/governance/members')],
  render: () => (
    <div className="p-6">
      <GovernanceMembersView />
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
      canvas.getByRole('heading', { level: 1, name: 'Member directory' }),
    ).toBeVisible();
    await expect(await canvas.findByText('Mart Saar')).toBeVisible();
    await expect(canvas.getByText('Demo Member')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /Mart Saar/ }),
    ).toHaveAttribute('href', '/channel/liis-kask-ee');
    await expect(
      canvas.getByRole('link', { name: 'Governance' }),
    ).toHaveAttribute('href', '/governance');
  },
};

export const SearchWithNoMatch: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Mart Saar');
    const search = canvas.getByRole('searchbox', {
      name: 'Search by name or username',
    });
    await userEvent.type(search, 'mart');
    await expect(canvas.getByText('Mart Saar')).toBeVisible();
    await expect(canvas.queryByText('Demo Member')).not.toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, 'nobody-here');
    await expect(
      canvas.getByText('No members match this search.'),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(canvas.getByText('Demo Member')).toBeVisible();
  },
};

export const SignedOut: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Sign in to view the member directory'),
    ).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(canvas.queryByText('Mart Saar')).not.toBeInTheDocument();
  },
};
