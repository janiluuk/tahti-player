import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEditorProjectView } from '@tahti-web/views/studio/StudioEditorProjectView';
import { expect, userEvent, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectNoDialog, expectVisible, findDialog } from './_lib/play';

const meta: Meta<typeof StudioEditorProjectView> = {
  title: 'Tahti/Studio/StudioEditorProjectView',
  component: StudioEditorProjectView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'One multitrack editor project (`/studio/editor/$id`): the timeline of archive clips (autosaved), session details with the linked library sound, a Pro editor link and Delete with a confirm.',
      },
    },
  },
  args: { id: 'proj-mock-1' },
  decorators: [
    withTahtiRouter('/studio/editor/proj-mock-1'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Northern Lights — edit' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: /Editor/ })).toHaveAttribute(
      'href',
      '/studio/editor',
    );
    await expectVisible(await canvas.findByText('Timeline'));
    await expect(
      canvas.getByText(
        'Arrange native archive clips into a non-destructive multitrack session.',
      ),
    ).toBeVisible();
    await expect(canvas.getByText('Session')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open in Library' }),
    ).toHaveAttribute('href', '/studio/sounds/arch-mock-1');
    await expect(
      canvas.getByRole('link', { name: 'Open Northern Lights — edit' }),
    ).toHaveAttribute('href', '/studio/sounds/arch-mock-1/editor');
  },
};

export const ConfirmDelete: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', {
        name: 'Delete Northern Lights — edit',
      }),
    );
    const dialog = await findDialog(
      canvasElement,
      'Delete “Northern Lights — edit”?',
    );
    await expect(
      dialog.getByText(
        'This removes the multitrack session. Linked archive audio stays in your library.',
      ),
    ).toBeVisible();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Northern Lights — edit' }),
    ).toBeVisible();
  },
};
