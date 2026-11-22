import type { Meta, StoryObj } from '@storybook/react-vite';
import { GreenRoomView } from '@tahti-web/views/GreenRoomView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof GreenRoomView> = {
  title: 'Tahti/Channel/GreenRoomView',
  component: GreenRoomView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Guest side of an artist's green room (`/u/$username/green-room`): the invite-only preview stream before a broadcast goes public. The server decides access; the page shows sign in, not open yet, invite required, waiting for preview, on air (with Tune in) or the Play preview stream button.",
      },
    },
  },
  args: { username: 'northern-lights' },
  decorators: [
    withTahtiRouter('/u/northern-lights/green-room'),
    withMockAuth(MOCK_USERS.listener),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PreviewOpen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Play preview stream' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('heading', { name: 'Green room' }),
    ).toBeVisible();
    await expect(
      canvas.getByText("Northern Lights's pre-show preview"),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        "You're in the green room — listen to the preview stream before the show goes public.",
      ),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: /@northern-lights/ }),
    ).toHaveAttribute('href', '/u/northern-lights');
  },
};

export const ArtistWithoutChannel: Story = {
  parameters: {
    mockData: mockData({ profile: (base) => ({ ...base, channel: null }) }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Green room unavailable'),
    ).toBeVisible();
    await expect(canvas.getByText('This artist has no channel.')).toBeVisible();
    await expect(
      canvas.getByText('Invite-only pre-show preview'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Check again' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: 'Play preview stream' }),
    ).toBeNull();
  },
};
