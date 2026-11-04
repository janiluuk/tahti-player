import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupsDirectoryView } from '@tahti-web/views/GroupsDirectoryView';
import { expect, userEvent, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GroupsDirectoryView> = {
  title: 'Tahti/Groups/GroupsDirectoryView',
  component: GroupsDirectoryView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Public groups directory at `/groups`: search box and a grid of public artist groups with cover, member and sound counts. Fixtures: `groups-mock.ts`.',
      },
    },
  },
  decorators: [withTahtiRouter('/groups')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('link', { name: 'Trance Mixes and DJ Sets' }),
    ).toHaveAttribute('href', '/groups/trance-mixes');
  },
};

export const SearchNoMatch: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Trance Mixes and DJ Sets' });
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search groups' }),
      'zzzz-no-such-group',
    );
    await expect(
      await canvas.findByText('No groups match that search'),
    ).toBeVisible();
  },
};
