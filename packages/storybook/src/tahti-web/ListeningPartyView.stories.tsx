import type { Meta, StoryObj } from '@storybook/react-vite';
import { MOCK_LISTENING_PARTY_IDS } from '@tahti-web/api/listening-parties-mock';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { ListeningPartyView } from '@tahti-web/views/ListeningPartyView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ListeningPartyView> = {
  title: 'Tahti/Release/ListeningPartyView',
  component: ListeningPartyView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The listening party page at `/party/$id`: countdown hero with the host note and Join, the tracklist with the playing track, liner notes and credits, the host's purchase tiers and the host channel chat. Join plays the current track in the app player at the server offset. Fixtures: `listening-parties-mock.ts` (one party per state).",
      },
    },
  },
  args: { id: MOCK_LISTENING_PARTY_IDS.scheduled },
  decorators: [
    withTahtiRouter(`/party/${MOCK_LISTENING_PARTY_IDS.scheduled}`),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const visible = (element: HTMLElement | undefined) =>
  waitFor(() => expect(element).toBeVisible());

async function findParty(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await canvas.findByRole('heading', { level: 1, name: 'Listening party' });
  return canvas;
}

export const Scheduled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await visible(canvas.getByRole('heading', { name: 'Polar Static' }));
    await expect(canvas.getByRole('timer')).toHaveTextContent(/Starts in/);
    await visible(canvas.getByText('Pre-release'));
    await visible(canvas.getByRole('button', { name: 'Join at the start' }));
    await expect(
      canvas.getByRole('region', { name: 'Liner notes' }),
    ).toHaveTextContent(/cabin north of Rovaniemi/);
    await visible(canvas.getByRole('button', { name: /Buy Polar Static/ }));
  },
};

export const Live: Story = {
  args: { id: MOCK_LISTENING_PARTY_IDS.live },
  decorators: [withTahtiRouter(`/party/${MOCK_LISTENING_PARTY_IDS.live}`)],
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await visible(canvas.getByText('Live now'));
    const tracklist = canvas.getByRole('region', { name: 'Tracklist' });
    const current = within(tracklist)
      .getAllByRole('listitem')
      .find((row) => row.getAttribute('aria-current') === 'true');
    await expect(current).toHaveTextContent('Aurora Drift');
    await visible(canvas.getByRole('region', { name: 'Party chat' }));
  },
};

export const LiveJoin: Story = {
  ...Live,
  beforeEach: () => {
    usePlayerStore.setState({ queue: [], currentId: null, status: 'idle' });
  },
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Join the party' }),
    );
    await expect(await canvas.findByText('Listening along')).toBeVisible();
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).toBe(
        `party:${MOCK_LISTENING_PARTY_IDS.live}:lp-track-ps-2`,
      ),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Leave' }));
    await expect(
      await canvas.findByRole('button', { name: 'Join the party' }),
    ).toBeVisible();
  },
};

export const Ended: Story = {
  args: { id: MOCK_LISTENING_PARTY_IDS.ended },
  decorators: [withTahtiRouter(`/party/${MOCK_LISTENING_PARTY_IDS.ended}`)],
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await visible(canvas.getByText(/has ended/));
    await expect(
      canvas.getByRole('link', { name: 'Open the release' }),
    ).toHaveAttribute('href', '/r/forest-cover');
    await expect(
      canvas.queryByRole('button', { name: /^Join (the party|at the start)$/ }),
    ).toBeNull();
  },
};

export const Canceled: Story = {
  args: { id: MOCK_LISTENING_PARTY_IDS.canceled },
  decorators: [withTahtiRouter(`/party/${MOCK_LISTENING_PARTY_IDS.canceled}`)],
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await visible(canvas.getByText(/canceled this listening party/));
    await expect(
      canvas.queryByRole('region', { name: 'Party chat' }),
    ).toBeNull();
  },
};

export const StoreOff: Story = {
  parameters: {
    mockData: mockData({
      listeningParty: (base) => (base ? { ...base, purchaseTiers: [] } : base),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = await findParty(canvasElement);
    await expect(canvas.queryByRole('region', { name: 'Store' })).toBeNull();
  },
};

export const NotFound: Story = {
  args: { id: 'lp-missing' },
  decorators: [withTahtiRouter('/party/lp-missing')],
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText('Listening party not found'),
    ).toBeVisible();
  },
};
