import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { TAHTI_RADIO_SLUG } from '@tahti-web/api/client';
import { usePlayerStore } from '@tahti-web/stores/playerStore';
import { RadioView } from '@tahti-web/views/RadioView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';
import { findDialog, selectTab } from './_lib/play';

const withIdlePlayer: Decorator = (Story) => {
  usePlayerStore.setState({ queue: [], currentId: null, status: 'idle' });
  return <Story />;
};

const meta: Meta<typeof RadioView> = {
  title: 'Tahti/Radio/RadioView',
  component: RadioView,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [withIdlePlayer, withTahtiRouter('/radio')],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Signed out: on air with the 24/7 rotation, the member relay banner, and
// the Up next / Just played / Featured tabs. No booking button.
export const Visitor: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Live now on the member relay/),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Open booking calendar' }),
    ).toBeNull();
  },
};

export const PlayRadio: Story = {
  name: 'Play the station',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Play Radio' }),
    );
    await expect(
      await canvas.findByRole('button', { name: 'Pause Radio' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(usePlayerStore.getState().currentId).toBe(
        `radio:${TAHTI_RADIO_SLUG}`,
      ),
    );
  },
};

export const JustPlayed: Story = {
  name: 'Just played, track info',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Play Radio' });
    await selectTab(canvas, /Just played/);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Track info for Route 550' }),
    );
    const dialog = await findDialog(canvasElement, 'Track info');
    await expect(dialog.getByText('Route 550')).toBeVisible();
  },
};

export const Featured: Story = {
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Play Radio' });
    await selectTab(canvas, /Featured/);
    await waitFor(() =>
      expect(canvas.getByTestId('radio-featured')).toBeVisible(),
    );
  },
};

export const BookASlot: Story = {
  name: 'Signed in, open booking calendar',
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Open booking calendar' }),
    );
    await findDialog(canvasElement, /schedule/);
  },
};

export const UpNextRotation: Story = {
  name: 'Up next: rotation tracks',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      radio: () => ({ live: false, channel: null }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rotation = await canvas.findByTestId('radio-up-next-rotation');
    await expect(rotation).toBeVisible();
    await expect(within(rotation).getByText('Aurora Drift')).toBeVisible();
    await expect(within(rotation).getAllByRole('listitem')).toHaveLength(3);
  },
};

export const Offline: Story = {
  name: 'Station offline, no member relay',
  decorators: [withMockAuth(MOCK_USERS.listener)],
  parameters: {
    mockData: mockData({
      channel: (base, slug) =>
        slug === TAHTI_RADIO_SLUG ? { ...base, hlsUrl: null } : base,
      radio: () => ({ live: false, channel: null }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Off air')).toBeVisible();
    await expect(canvas.queryByText(/member relay/)).toBeNull();
  },
};
