import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  resetMockBroadcastPreflight,
  type BroadcastPreflight,
} from '@tahti-web/api/broadcast';
import {
  mockSimulateSignal,
  setMockChannelLive,
  setMockChannelOffline,
  setMockReconnecting,
} from '@tahti-web/api/mock-live-session';
import { StudioGoLiveView } from '@tahti-web/views/studio/StudioGoLiveView';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { mockData } from './_lib/mock-data';

type Encoder = 'off' | 'connected' | 'live' | 'reconnecting';

function seedEncoder(encoder: Encoder) {
  resetMockBroadcastPreflight();
  setMockChannelOffline();
  if (encoder === 'connected') {
    mockSimulateSignal(true);
  }
  if (encoder === 'live') {
    mockSimulateSignal(true);
    setMockChannelLive('northern-lights');
  }
  if (encoder === 'reconnecting') {
    setMockReconnecting(new Date(Date.now() + 90_000).toISOString());
  }
  return () => {
    setMockChannelOffline();
    resetMockBroadcastPreflight();
  };
}

const showInfo = (
  overrides: Partial<BroadcastPreflight> = {},
): ((base: BroadcastPreflight) => BroadcastPreflight) => {
  return (base) => ({ ...base, ...overrides });
};

const READY_INFO = {
  title: 'Late Night Ambient',
  tagline: 'Slow synths until sunrise',
};

const meta: Meta<typeof StudioGoLiveView> = {
  title: 'Tahti/Studio/StudioGoLiveView',
  component: StudioGoLiveView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Studio → Broadcast → Go live: status chip, Start broadcast and a six-step setup (show info, credentials, encoder, recording, destinations, green room).',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/studio/go-live'),
    withMockAuth({
      ...MOCK_USERS.artist,
      channel: { slug: 'northern-lights', state: 'OFFLINE' },
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const MOBILE = { viewport: { defaultViewport: 'mobile1' } };

export const Loading: Story = {
  beforeEach: () => seedEncoder('off'),
  parameters: {
    mockData: mockData({
      broadcastPreflight: () =>
        new Promise<never>(() => undefined) as unknown as BroadcastPreflight,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = await canvas.findByTestId('go-live-loading');
    await expect(region).toHaveAttribute('aria-busy', 'true');
  },
};

export const LoadingMobile: Story = {
  ...Loading,
  parameters: { ...Loading.parameters, ...MOBILE },
};

export const LoadError: Story = {
  beforeEach: () => seedEncoder('off'),
  parameters: {
    mockData: mockData({
      broadcastPreflight: () => {
        throw new Error('The show info service is unavailable.');
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('The show info service is unavailable.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /Retry|Try again/ }),
    ).toBeVisible();
    await expect(canvas.getByTestId('stepper')).toBeInTheDocument();
  },
};

export const LoadErrorMobile: Story = {
  ...LoadError,
  parameters: { ...LoadError.parameters, ...MOBILE },
};

export const Empty: Story = {
  beforeEach: () => seedEncoder('off'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const start = await canvas.findByRole('button', {
      name: 'Start broadcast',
    });
    await expect(start).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByTestId('go-live-status')).toHaveTextContent(
      'Offline',
    );

    const name = await canvas.findByLabelText(/Show name/);
    await userEvent.type(name, 'Late Night Ambient');
    await userEvent.tab();
    await waitFor(
      () =>
        expect(canvas.getByTestId('show-info-autosave')).toHaveTextContent(
          'Saved',
        ),
      { timeout: 3000 },
    );
    await expect(start).toHaveAttribute('aria-disabled', 'true');
    await expect(
      canvas.getByText('To start, connect your encoder.'),
    ).toBeInTheDocument();
  },
};

export const EmptyMobile: Story = {
  beforeEach: () => seedEncoder('off'),
  parameters: MOBILE,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = await canvas.findByRole('button', {
      name: /Step 1 of 6: Show info/,
    });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    await expect(
      canvas.getByRole('list', { name: 'Go live steps' }),
    ).toBeVisible();
  },
};

export const Ready: Story = {
  beforeEach: () => seedEncoder('connected'),
  parameters: {
    mockData: mockData({ broadcastPreflight: showInfo(READY_INFO) }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId('go-live-status')).toHaveTextContent('Ready'),
    );
    await expect(
      canvas.getByRole('button', { name: 'Start broadcast' }),
    ).not.toHaveAttribute('aria-disabled');
  },
};

export const ReadyMobile: Story = {
  ...Ready,
  parameters: { ...Ready.parameters, ...MOBILE },
};

export const Live: Story = {
  beforeEach: () => seedEncoder('live'),
  parameters: {
    mockData: mockData({
      broadcastPreflight: showInfo({ ...READY_INFO, session: 'LIVE' }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId('go-live-status')).toHaveAttribute(
        'data-status',
        'live',
      ),
    );
    await expect(
      canvas.getByRole('button', { name: 'End broadcast' }),
    ).toBeVisible();
    await expect(
      await canvas.findByRole('button', { name: /Show type/ }),
    ).toBeDisabled();
    await expect(canvas.getByLabelText(/Show name/)).toBeEnabled();
  },
};

export const LiveMobile: Story = {
  ...Live,
  parameters: { ...Live.parameters, ...MOBILE },
};

export const Reconnecting: Story = {
  beforeEach: () => seedEncoder('reconnecting'),
  parameters: {
    mockData: mockData({
      broadcastPreflight: showInfo({ ...READY_INFO, session: 'LIVE' }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId('go-live-status')).toHaveAttribute(
        'data-status',
        'reconnecting',
      ),
    );
    await expect(canvas.getByTestId('stepper-step-encoder')).toHaveAttribute(
      'data-status',
      'error',
    );
  },
};

export const ReconnectingMobile: Story = {
  ...Reconnecting,
  parameters: { ...Reconnecting.parameters, ...MOBILE },
};
