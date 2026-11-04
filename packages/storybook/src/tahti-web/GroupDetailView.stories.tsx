import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupDetailView } from '@tahti-web/views/GroupDetailView';
import { expect, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof GroupDetailView> = {
  title: 'Tahti/Groups/GroupDetailView',
  component: GroupDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public group page at `/groups/$slug`: cover, description, founder, members, the collective playlist link, "Listen together" (starts a Jam on the group playlist) and Join, Request to join or Leave depending on the viewer. Owners and admins also get a Manage link into Studio. Fixtures: `groups-mock.ts`.',
      },
    },
  },
  args: { slug: 'trance-mixes' },
  decorators: [
    withTahtiRouter('/groups/trance-mixes'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Owner: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: /Collective playlist/ }),
    ).toHaveAttribute('href', '/u/demo/c/group-trance-mixes');
    await expect(
      canvas.getByRole('button', { name: /Listen together/ }),
    ).toBeEnabled();
    await expect(canvas.getByRole('link', { name: /Manage/ })).toHaveAttribute(
      'href',
      '/studio/groups/trance-mixes',
    );
  },
};

export const Member: Story = {
  args: { slug: 'finland-djs' },
  decorators: [withTahtiRouter('/groups/finland-djs')],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('button', { name: /Leave group/ }),
    );
    await expectVisible(await canvas.findByRole('list', { name: 'Members' }));
  },
};

export const NotFound: Story = {
  args: { slug: 'no-such-group' },
  decorators: [withTahtiRouter('/groups/no-such-group')],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(
        /group not found|ryhmää ei löytynyt/i,
      ),
    ).toBeInTheDocument();
  },
};
