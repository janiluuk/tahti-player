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
// the Up next / Shows / Just played / Featured tabs.
export const Visitor: Story = {
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText(/Live now on the member relay/),
    ).toBeVisible();
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

// Signed out: the Shows tab lists the booked live shows day by day, with
// the full schedule link and no booking button.
export const ShowsVisitor: Story = {
  name: 'Shows tab, signed out',
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Play Radio' });
    await selectTab(canvas, /Shows/);
    const shows = await canvas.findByTestId('radio-booked-shows');
    await expect(
      within(shows).getByRole('link', { name: /Full schedule/ }),
    ).toBeVisible();
    await expect(
      within(shows).queryByRole('button', { name: /Book a slot/ }),
    ).toBeNull();
  },
};

export const BookASlot: Story = {
  name: 'Shows tab, signed in, open booking calendar',
  decorators: [withMockAuth(MOCK_USERS.artist)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Play Radio' });
    await selectTab(canvas, /Shows/);
    await userEvent.click(
      await canvas.findByRole('button', { name: /Book a slot/ }),
    );
    await findDialog(canvasElement, /schedule/);
  },
};

export const UpNextRotation: Story = {
  name: 'Up next: rotation tracks, now-playing overlay',
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
    const overlay = canvas.getByTestId('radio-now-playing-overlay');
    await expect(within(overlay).getByText('Now playing')).toBeVisible();
    await expect(
      within(overlay).getByTestId('radio-now-playing-next'),
    ).toHaveTextContent(/^Next: /);
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
