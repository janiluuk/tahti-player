import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioEditorListView } from '@tahti-web/views/studio/StudioEditorListView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectNoDialog, findDialog } from './_lib/play';

const meta: Meta<typeof StudioEditorListView> = {
  title: 'Tahti/Studio/StudioEditorListView',
  component: StudioEditorListView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Editor (`/studio/editor`): multitrack editor projects with Open session and Pro editor links, a New session dialog (title, optional seed sound) and Open from library, a dialog that browses your sounds by content type and opens one in the pro editor.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/studio/editor'),
    withMockAuth(MOCK_USERS.artist),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Projects: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Editor' }),
    ).toBeVisible();
    await expect(
      await canvas.findByText('Northern Lights — edit'),
    ).toBeVisible();
    await expect(canvas.getByText('Projects')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Open Northern Lights — edit' }),
    ).toHaveAttribute('href', '/studio/editor/proj-mock-1');
    await expect(
      canvas.getByRole('link', { name: 'Pro editor' }),
    ).toHaveAttribute('href', '/studio/sounds/arch-mock-1/editor');
    await expect(
      canvas.getByRole('button', { name: 'New session' }),
    ).toBeVisible();
  },
};

export const NewSessionDialog: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Northern Lights — edit');
    await userEvent.click(canvas.getByRole('button', { name: 'New session' }));
    const dialog = await findDialog(canvasElement, /New session/);
    await expect(
      dialog.getByRole('textbox', { name: 'Title' }),
    ).toHaveAttribute('placeholder', 'Untitled session');
    await expect(dialog.getByText('Seed from sound (optional)')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeEnabled();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};

export const OpenFromLibrary: Story = {
  parameters: {
    mockData: mockData({
      studioSounds: (base) =>
        base.filter((sound) => !sound.embedProvider).slice(0, 3),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Northern Lights — edit');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open from library' }),
    );
    const dialog = await findDialog(canvasElement, 'Open from library');
    await expect(
      dialog.getByText(
        'Browse your library by content type, then open an item in the pro editor.',
      ),
    ).toBeVisible();
    await expect(
      dialog.getByRole('tablist', { name: 'Library content types' }),
    ).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const opens = await dialog.findAllByRole('link', { name: 'Open' });
    await expect(opens).toHaveLength(3);

    await userEvent.type(
      dialog.getByRole('searchbox', { name: 'Search library' }),
      'zzz-no-such-sound',
    );
    await waitFor(() =>
      expect(
        dialog.getByText('No library items match this selection.'),
      ).toBeVisible(),
    );
  },
};
