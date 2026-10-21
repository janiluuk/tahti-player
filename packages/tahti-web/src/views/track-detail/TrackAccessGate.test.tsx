// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TrackAccessGate } from './TrackAccessGate';

type Props = ComponentProps<typeof TrackAccessGate>;

async function renderGate(overrides: Partial<Props> = {}) {
  const props: Props = {
    gate: { reason: 'SUBSCRIBERS_ONLY' },
    artist: { username: 'nightdrive', displayName: 'Night Drive' },
    signedIn: true,
    onSignIn: vi.fn(),
    ...overrides,
  };
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <TrackAccessGate {...props} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return props;
}

describe('TrackAccessGate', () => {
  afterEach(cleanup);

  it('sends a signed-in fan to the artist fan tiers', async () => {
    await renderGate();
    expect(
      screen.getByRole('region', { name: 'Fan subscribers only' }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Subscribe to listen' })
        .getAttribute('href'),
    ).toBe('/subscribe/nightdrive');
    expect(screen.queryByRole('button', { name: 'Sign in to listen' })).toBe(
      null,
    );
  });

  it('asks a signed-out visitor to sign in', async () => {
    const props = await renderGate({ signedIn: false });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to listen' }));
    expect(props.onSignIn).toHaveBeenCalled();
    expect(
      screen.getByRole('link', { name: 'Subscribe to listen' }),
    ).toBeTruthy();
  });

  it('offers to buy a purchase-gated track or subscribe instead', async () => {
    const onBuy = vi.fn();
    await renderGate({
      gate: { reason: 'PURCHASE', tierId: 'tier' },
      priceCents: 350,
      onBuy,
    });
    expect(screen.getByRole('region', { name: 'Buy to listen' })).toBeTruthy();
    expect(screen.getByText(/Buy this track \(€3\.50\)/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Buy this track' }));
    expect(onBuy).toHaveBeenCalled();
    expect(
      screen
        .getByRole('link', { name: 'Subscribe instead' })
        .getAttribute('href'),
    ).toBe('/subscribe/nightdrive');
  });

  it('does not offer a buy button to signed-out visitors', async () => {
    await renderGate({
      gate: { reason: 'PURCHASE', tierId: 'tier' },
      signedIn: false,
      onBuy: vi.fn(),
    });
    expect(screen.queryByRole('button', { name: 'Buy this track' })).toBe(null);
    expect(
      screen.getByRole('button', { name: 'Sign in to listen' }),
    ).toBeTruthy();
  });
});
