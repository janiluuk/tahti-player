import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioShowDetailView } from '@tahti-web/views/studio/StudioShowDetailView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { resetStudioShowStorage, SINGLE_SHOW } from './_fixtures/studio';
import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import {
  expectNoDialog,
  expectVisible,
  findDialog,
  findToast,
} from './_lib/play';

const SHOW_ID = 'show-series-demo';

const meta: Meta<typeof StudioShowDetailView> = {
  title: 'Tahti/Studio/StudioShowDetailView',
  component: StudioShowDetailView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Shows → one show: header with the show type and mode, then Overview (show defaults, schedule and episode list), Episodes (an editor per episode) and Recordings tabs, plus the "New episode" dialog. A single show has no episodes and no "New episode" button.',
      },
    },
  },
  args: { id: SHOW_ID },
  beforeEach: resetStudioShowStorage,
  decorators: [
    withToaster(),
    withTahtiRouter(`/studio/shows/${SHOW_ID}`),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Friday Frequency' }),
    );
    await expectVisible(canvas.getByText('Live set · Series'));
    await expect(
      canvas.getByRole('link', { name: 'Back to Shows' }),
    ).toHaveAttribute('href', '/studio/shows');
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toHaveValue(
      'Friday Frequency',
    );
    await expectVisible(
      canvas.getByRole('button', { name: 'Book next 2h slot' }),
    );
    await expectVisible(
      await canvas.findByRole('link', {
        name: 'Friday Frequency — Episode 2',
      }),
    );
    await expectVisible(canvas.getByRole('heading', { name: 'Episodes' }));
    await expectVisible(canvas.getByRole('link', { name: 'Review' }));
  },
};

// Saving the show defaults confirms with a toast.
export const SaveDefaults: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByRole('textbox', { name: 'Title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Friday Frequency Live');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save defaults' }),
    );
    await findToast(
      canvasElement,
      'Show details saved — new episodes will inherit these.',
    );
    await expectVisible(
      canvas.getByRole('heading', { name: 'Friday Frequency Live' }),
    );
  },
};

export const EpisodesAndRecordings: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Friday Frequency' });
    await userEvent.click(canvas.getByRole('tab', { name: /Episodes/ }));
    await expectVisible(await canvas.findByText('All episodes'));
    await waitFor(() =>
      expect(
        canvas.getAllByRole('textbox', { name: 'Episode title' }),
      ).toHaveLength(3),
    );

    await userEvent.click(canvas.getByRole('tab', { name: /Recordings/ }));
    await expectVisible(await canvas.findByText('Recordings from this show'));
    await expectVisible(
      canvas.getByRole('link', { name: 'Friday Frequency — Episode 2' }),
    );
    await expectVisible(canvas.getByRole('link', { name: 'Play recording' }));
  },
};

// The dialog prefills the next number and title; an upload needs a file,
// recording from a broadcast does not.
export const NewEpisode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Friday Frequency' });
    await userEvent.click(canvas.getByRole('button', { name: 'New episode' }));
    const dialog = await findDialog(canvasElement, 'New episode');
    await expectVisible(dialog.getByText('#4'));
    await expectVisible(
      dialog.getByText('Title: Friday Frequency — Episode 4'),
    );
    await expect(
      dialog.getByRole('button', { name: 'Create episode' }),
    ).toBeDisabled();
    await userEvent.click(
      dialog.getByRole('radio', { name: 'Record from broadcast' }),
    );
    await expect(
      dialog.getByRole('button', { name: 'Create & go record' }),
    ).toBeEnabled();
    await userEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    await expectNoDialog(canvasElement);
  },
};

export const SingleShow: Story = {
  parameters: { mockData: mockData({ showSeries: () => [SINGLE_SHOW] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Live set · Single show'));
    await expect(canvas.getByRole('textbox', { name: 'Tagline' })).toHaveValue(
      'Deep electronics after dark',
    );
    await expect(
      canvas.queryByRole('button', { name: 'New episode' }),
    ).toBeNull();
    await expect(
      canvas.queryByRole('heading', { name: 'Episodes' }),
    ).toBeNull();
  },
};

export const NotFound: Story = {
  args: { id: 'missing-show' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(await canvas.findByText('Show not found'));
  },
};
