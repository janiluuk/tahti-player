import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioShowsView } from '@tahti-web/views/studio/StudioShowsView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { resetStudioShowStorage } from './_fixtures/studio';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { expectNoDialog, expectVisible, findDialog } from './_lib/play';

const meta: Meta<typeof StudioShowsView> = {
  title: 'Tahti/Studio/StudioShowsView',
  component: StudioShowsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Shows: every show series with its next episode number, episode count and slot length, a Manage link per show, and the "New show" dialog (title, description, thumbnail, backdrop, record-by-default, series or single show, episode length).',
      },
    },
  },
  beforeEach: resetStudioShowStorage,
  decorators: [
    withTahtiRouter('/studio/shows'),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(canvas.getByRole('heading', { name: 'Shows' }));
    const show = await canvas.findByRole('link', { name: 'Friday Frequency' });
    await expect(show).toHaveAttribute(
      'href',
      '/studio/shows/show-series-demo',
    );
    await waitFor(() =>
      expect(
        canvas.getByText(
          'Next episode #4, 3 episodes, 2h slots, Fridays, continuing series',
        ),
      ).toBeVisible(),
    );
    await expectVisible(canvas.getByRole('link', { name: 'Boathouse Talk' }));
    await expect(canvas.getAllByRole('link', { name: 'Manage' })).toHaveLength(
      4,
    );
  },
};

export const Empty: Story = {
  parameters: { mockData: mockData({ showSeries: () => [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('No shows yet'));
    await expectVisible(
      canvas.getByText('Create one to start numbering episodes.'),
    );
    await expect(
      canvas.getAllByRole('button', { name: 'New show' }),
    ).toHaveLength(2);
  },
};

// The dialog needs a title; a single show has no episode length.
export const CreateShow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('link', { name: 'Friday Frequency' });
    await userEvent.click(canvas.getByRole('button', { name: 'New show' }));
    const dialog = await findDialog(canvasElement, /New show/);
    const create = dialog.getByRole('button', { name: 'Create show' });
    await expect(create).toBeDisabled();
    await expect(
      dialog.getByRole('switch', { name: 'Record broadcasts by default' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expectVisible(dialog.getByRole('radio', { name: '1 hour' }));

    await userEvent.click(dialog.getByRole('radio', { name: 'Single show' }));
    await waitFor(() =>
      expect(dialog.queryByRole('radio', { name: '1 hour' })).toBeNull(),
    );
    await userEvent.type(
      dialog.getByRole('textbox', { name: 'Show title' }),
      'Sauna Sessions',
    );
    await expect(create).toBeEnabled();
    await userEvent.click(create);
    await expectNoDialog(canvasElement);
  },
};
