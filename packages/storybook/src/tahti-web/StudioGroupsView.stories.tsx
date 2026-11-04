import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioGroupsView } from '@tahti-web/views/studio/StudioGroupsView';
import { expect, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const meta: Meta<typeof StudioGroupsView> = {
  title: 'Tahti/Studio/StudioGroupsView',
  component: StudioGroupsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Music → Groups: the groups the artist owns or belongs to with role, member and sound counts and anything waiting for review, plus "New group" for the create form. Fixtures: `groups-mock.ts`.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/groups'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: /^Groups$|^Ryhmät$/ }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('link', {
        name: 'Open Trance Mixes and DJ Sets',
      }),
    ).toHaveAttribute('href', '/studio/groups/trance-mixes');
    await expect(canvas.getByText('2 to review')).toBeVisible();
  },
};

export const CreateForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'New group' }),
    );
    await expect(
      await canvas.findByRole('button', { name: 'Create group' }),
    ).toBeDisabled();
    await userEvent.type(canvas.getByLabelText('Name'), 'Night drivers');
    await expect(
      canvas.getByRole('button', { name: 'Create group' }),
    ).toBeEnabled();
  },
};
