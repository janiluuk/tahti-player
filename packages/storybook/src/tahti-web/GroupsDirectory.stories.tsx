import type { Meta, StoryObj } from '@storybook/react-vite';
import { GroupsDirectory } from '@tahti-web/components/GroupsDirectory';
import { expect, userEvent, within } from 'storybook/test';

import { withPageSurface, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof GroupsDirectory> = {
  title: 'Tahti/Discover/GroupsDirectory',
  component: GroupsDirectory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Public artist-group grid with search. Mounted on Discover → Groups (`?tab=groups`) and inside `GroupsDirectoryView` at `/groups`. Fixtures: `groups-mock.ts` (Trance Mixes, Finland DJs, Ambient Lab, Vinyl Crate Diggers, Live Electronics).',
      },
    },
  },
  decorators: [withPageSurface(), withTahtiRouter('/discover?tab=groups')],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadyGroups: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of [
      'Trance Mixes and DJ Sets',
      "Finland DJ's / Producers",
      'Ambient Lab',
      'Vinyl Crate Diggers',
      'Live Electronics',
    ]) {
      await expect(await canvas.findByRole('link', { name })).toBeVisible();
    }
  },
};

export const SearchFilters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Ambient Lab' });
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Search groups' }),
      'vinyl',
    );
    await expect(
      await canvas.findByRole('link', { name: 'Vinyl Crate Diggers' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('link', { name: 'Ambient Lab' }),
    ).toBeNull();
  },
};
