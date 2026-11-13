// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { act, fireEvent, screen, within } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  BroadcastPreflight,
  BroadcastPreflightPatch,
  SignalStatus,
} from '../../api/broadcast';
import { applyLocale } from '../../lib/locale';
import { useAuthStore } from '../../stores/authStore';
import { signalAnnouncement } from './go-live/SignalPanel';
import { StudioGoLiveView } from './StudioGoLiveView';

const postGoLive = vi.fn();
const postEndBroadcast = vi.fn();
const state = vi.hoisted(() => ({
  preflight: null as BroadcastPreflight | null,
  preflightFails: false,
  signal: null as SignalStatus | null,
}));
const mockChannelState = vi.hoisted(() => ({ current: 'PREVIEW' }));

function preflight(
  overrides: Partial<BroadcastPreflight> = {},
): BroadcastPreflight {
  return {
    session: 'NONE',
    title: null,
    tagline: null,
    showType: 'LIVE_SET',
    visibility: 'PUBLIC',
    autoPublish: true,
    episodeNumber: null,
    seriesId: null,
    artworkUrl: null,
    coverUrl: null,
    plannedRadioShow: null,
    plannedLiveShow: null,
    ...overrides,
  };
}

vi.mock('../../api/broadcast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/broadcast')>();
  return {
    ...actual,
    fetchStreamSettings: async () => ({
      data: {
        rtmp: { server: 'rtmp://x', streamKey: 'k' },
        icecast: { server: 'icecast://x', mount: '/m', password: 'p' },
        hlsUrl: 'https://x/live.m3u8',
      },
      meta: { source: 'mock' as const },
    }),
    fetchBroadcastUsage: async () => ({
      data: {
        unlimited: true,
        secondsUsed: 0,
        secondsRemaining: null,
        weeklyCapSeconds: 0,
        blocked: false,
      },
      meta: { source: 'mock' as const },
    }),
    fetchRtmpTargets: async () => ({
      data: [],
      meta: { source: 'mock' as const },
    }),
    fetchBroadcastPreflight: async () =>
      state.preflightFails
        ? { data: null, meta: { source: 'api' as const, reason: 'Boom' } }
        : { data: state.preflight, meta: { source: 'mock' as const } },
    patchBroadcastPreflight: async (patch: BroadcastPreflightPatch) => {
      state.preflight = { ...(state.preflight ?? preflight()), ...patch };
      return { data: state.preflight };
    },
    fetchSignalStatus: async () => ({
      data: state.signal ?? {
        connected: true,
        codec: 'aac',
        bitrateKbps: 192,
        listeners: 0,
        ingest: 'connected' as const,
        reconnectDeadline: null,
      },
      meta: { source: 'mock' as const },
    }),
    getMockChannelState: () => mockChannelState.current,
    postGoLive: (...args: unknown[]) => postGoLive(...args),
    postEndBroadcast: (...args: unknown[]) => postEndBroadcast(...args),
  };
});

function createRouterFor(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const route = createRoute({
    getParentRoute: () => rootRoute,
    path: '/studio/go-live',
    validateSearch: (search: Record<string, unknown>) => ({
      step: typeof search.step === 'string' ? search.step : undefined,
      tab: typeof search.tab === 'string' ? search.tab : undefined,
    }),
    component: StudioGoLiveView,
  });
  return createRouter({
    routeTree: rootRoute.addChildren([route]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubEnv('VITE_FORCE_MOCK', '1');
  state.preflight = preflight();
  state.preflightFails = false;
  state.signal = null;
  mockChannelState.current = 'PREVIEW';
  postGoLive.mockResolvedValue({ ok: true });
  postEndBroadcast.mockResolvedValue({ ok: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.replaceChildren();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

async function renderView(path = '/studio/go-live') {
  useAuthStore.setState({
    user: {
      id: 'user-1',
      email: 'artist@tahti.live',
      username: 'artist',
      displayName: 'An Artist',
      role: 'ARTIST',
      isBoard: false,
      isMember: true,
      channel: { slug: 'artist', state: 'OFFLINE' },
    },
    hydrated: true,
    loading: false,
  });
  const router = createRouterFor(path);
  await act(async () => {
    root.render(<RouterProvider router={router} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return router;
}

const startButton = () =>
  screen.getByRole('button', { name: /Start broadcast/ });

describe('StudioGoLiveView Start broadcast', () => {
  it('stays disabled and says what is missing until a show name is saved', async () => {
    await renderView();

    const start = startButton();
    expect(start).toHaveAttribute('aria-disabled', 'true');
    const reason = document.getElementById(
      start.getAttribute('aria-describedby') ?? '',
    );
    expect(reason?.textContent).toBe('To start, add a show name.');

    await act(async () => fireEvent.click(start));
    expect(screen.queryByText('Go live now?')).toBeNull();
  });

  it('lists both required steps when the encoder is also missing', async () => {
    state.signal = {
      connected: false,
      codec: null,
      bitrateKbps: null,
      listeners: null,
      ingest: 'disconnected',
      reconnectDeadline: null,
    };
    mockChannelState.current = 'OFFLINE';
    await renderView();

    expect(startButton()).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByText('To start, add a show name and connect your encoder.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('go-live-status')).toHaveTextContent('Offline');
  });

  it('confirms before going live once show name and signal are done', async () => {
    state.preflight = preflight({ title: 'Friday Frequency' });
    await renderView();

    expect(startButton()).not.toHaveAttribute('aria-disabled');
    expect(screen.getByTestId('go-live-status')).toHaveTextContent('Ready');

    await act(async () => fireEvent.click(startButton()));
    expect(postGoLive).not.toHaveBeenCalled();
    expect(screen.getByText('Go live now?')).toBeInTheDocument();

    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Go live' })),
    );
    expect(postGoLive).toHaveBeenCalledTimes(1);
    expect(
      screen
        .getByText(
          'You’re live. The rotation has handed over to your broadcast.',
        )
        .getAttribute('role'),
    ).toBe('status');
  });

  it('announces a failed go-live as an alert', async () => {
    state.preflight = preflight({ title: 'Friday Frequency' });
    postGoLive.mockResolvedValue({ ok: false, error: 'No signal yet' });
    await renderView();
    await act(async () => fireEvent.click(startButton()));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Go live' })),
    );

    const banner = screen
      .getAllByText('No signal yet')
      .find((node) => node.getAttribute('role') === 'alert');
    expect(banner).toBeDefined();
  });
});

describe('StudioGoLiveView live states', () => {
  it('offers End broadcast behind a confirmation while live', async () => {
    state.preflight = preflight({ title: 'Live show', session: 'LIVE' });
    mockChannelState.current = 'LIVE';
    await renderView();

    expect(screen.getByTestId('go-live-status')).toHaveAttribute(
      'data-status',
      'live',
    );
    expect(
      screen.queryByRole('button', { name: /Start broadcast/ }),
    ).toBeNull();
    await act(async () =>
      fireEvent.click(screen.getByTestId('go-live-end-broadcast')),
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('End the broadcast?');
    await act(async () =>
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'End broadcast' }),
      ),
    );
    expect(postEndBroadcast).toHaveBeenCalledTimes(1);
  });

  it('shows reconnecting with its deadline and flags the encoder step', async () => {
    state.preflight = preflight({ title: 'Live show', session: 'LIVE' });
    mockChannelState.current = 'LIVE';
    state.signal = {
      connected: false,
      codec: null,
      bitrateKbps: null,
      listeners: null,
      ingest: 'reconnecting',
      reconnectDeadline: '2026-11-10T21:04:00.000Z',
    };
    await renderView('/studio/go-live?step=encoder');

    const chip = screen.getByTestId('go-live-status');
    expect(chip).toHaveAttribute('role', 'status');
    expect(chip).toHaveAttribute('data-status', 'reconnecting');
    expect(chip).toHaveTextContent(/Reconnecting.*until/);
    expect(screen.getByTestId('stepper-step-encoder')).toHaveAttribute(
      'data-status',
      'error',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/Reconnect it by/);
    expect(
      screen.queryByRole('button', { name: /Start broadcast/ }),
    ).toBeNull();
    expect(screen.getByTestId('go-live-end-broadcast')).toBeInTheDocument();
  });
});

describe('StudioGoLiveView steps', () => {
  it('opens the first required step that is still to do', async () => {
    await renderView();
    expect(screen.getByTestId('go-live-step-show-info')).toBeInTheDocument();
    expect(screen.getByTestId('stepper-step-show-info')).toHaveAttribute(
      'data-status',
      'current',
    );
    expect(screen.getByTestId('stepper-step-credentials')).toHaveAttribute(
      'data-status',
      'complete',
    );
  });

  it('maps an old ?tab= link to its step and rewrites the URL', async () => {
    const router = await renderView('/studio/go-live?tab=destinations');
    expect(screen.getByTestId('go-live-step-destinations')).toBeInTheDocument();
    expect(router.state.location.search).toEqual({ step: 'destinations' });
  });

  it('moves on with the Next button', async () => {
    const router = await renderView('/studio/go-live?step=credentials');
    await act(async () =>
      fireEvent.click(
        screen.getByRole('button', { name: 'Next: Encoder signal' }),
      ),
    );
    expect(router.state.location.search).toEqual({ step: 'encoder' });
    expect(screen.getByTestId('go-live-step-encoder')).toBeInTheDocument();
  });

  it('ends the last step with Start broadcast guidance', async () => {
    await renderView('/studio/go-live?step=green-room');
    expect(screen.getByTestId('go-live-final-guidance')).toHaveTextContent(
      /Start broadcast/,
    );
  });

  it('keeps the stepper and offers Retry when show info fails to load', async () => {
    state.preflightFails = true;
    await renderView();
    expect(
      screen.getByRole('list', { name: 'Go live steps' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();

    state.preflightFails = false;
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: /Retry|Try again/ })),
    );
    expect(screen.getByLabelText(/Show name/)).toBeInTheDocument();
  });
});

describe('StudioGoLiveView signal announcement', () => {
  it('tells screen readers the encoder signal is in', async () => {
    await renderView('/studio/go-live?step=encoder');
    expect(screen.getByTestId('signal-announcement').textContent).toBe(
      'Signal received. You can go live.',
    );
  });

  it('words each signal state', () => {
    expect(signalAnnouncement(true, true, false)).toBe(
      'Your broadcast is on air.',
    );
    expect(signalAnnouncement(false, false, false)).toBe(
      'No signal from your encoder.',
    );
    expect(signalAnnouncement(false, true, true)).toMatch(/used up/);
  });

  it('words each signal state in Finnish', async () => {
    await act(async () => {
      await applyLocale('fi_FI');
    });
    try {
      expect(signalAnnouncement(true, true, false)).toBe(
        'Lähetyksesi on käynnissä.',
      );
      expect(signalAnnouncement(false, true, true)).toMatch(/käytetty/);
    } finally {
      await act(async () => {
        await applyLocale('en_US');
      });
    }
  });
});
