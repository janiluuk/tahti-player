import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioGroupDetailView } from '@tahti-web/views/studio/StudioGroupDetailView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioGroupDetailView> = {
  title: 'Tahti/Studio/StudioGroupDetailView',
  component: StudioGroupDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Music → Groups → one group: settings (name, description, cover, join and submit policy, visibility), join requests and sound submissions to approve or reject, and links to the public group page and the collective playlist. Members without admin rights see a short note instead. Fixtures: `groups-mock.ts`.',
      },
    },
  },
  args: { slug: 'trance-mixes' },
  decorators: [
    withTahtiRouter('/studio/groups/trance-mixes'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Save settings' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Delete group' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('link', { name: /Collective playlist/ }),
    ).toHaveAttribute('href', '/u/demo/c/group-trance-mixes');
    await expect(
      canvas.getByRole('link', { name: /Public page/ }),
    ).toHaveAttribute('href', '/groups/trance-mixes');
  },
};

export const MemberOnly: Story = {
  args: { slug: 'finland-djs' },
  decorators: [withTahtiRouter('/studio/groups/finland-djs')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Your membership'),
    ).toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: 'Save settings' }),
    ).toBeNull();
  },
};

export const NotFound: Story = {
  args: { slug: 'no-such-group' },
  decorators: [withTahtiRouter('/studio/groups/no-such-group')],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Group not found'),
    ).toBeVisible();
  },
};
