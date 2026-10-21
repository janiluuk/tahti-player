import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  pairingToken,
  useDesktopJamStore,
  type TahtiNativeJam,
} from '../lib/jam/desktop';
import { JamIntegrationRow } from './JamIntegrationRow';

beforeEach(() => {
  localStorage.clear();
  useDesktopJamStore.setState({
    enabled: false,
    url: null,
    error: null,
    busy: false,
  });
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_JAM__ = undefined;
});

function installNative() {
  const start = vi.fn<TahtiNativeJam['start']>(async () => ({
    port: 4120,
    lanAddress: '192.168.1.20',
  }));
  const stop = vi.fn(async () => {});
  globalThis.__TAHTI_NATIVE_JAM__ = { start, stop, send: vi.fn() };
  return { start, stop };
}

describe('JamIntegrationRow', () => {
  it('starts the server with the pairing code and shows the link and QR code', async () => {
    const { start } = installNative();
    render(<JamIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'Tahti Jam' }));
    const token = pairingToken();
    expect(token).toMatch(/^[0-9a-f]{48}$/);
    expect(
      await screen.findByText(`http://192.168.1.20:4120/remote#token=${token}`),
    ).toBeTruthy();
    expect(start).toHaveBeenCalledWith(token);
    expect(screen.getByLabelText('Tahti Jam pairing QR code')).toBeTruthy();
  });

  it('keeps the pairing code across launches', () => {
    expect(pairingToken()).toBe(pairingToken());
  });

  it('makes a new pairing link and restarts the server with it', async () => {
    const { start, stop } = installNative();
    render(<JamIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'Tahti Jam' }));
    const first = pairingToken();
    fireEvent.click(
      await screen.findByRole('button', { name: 'New pairing link' }),
    );
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2));
    const second = pairingToken();
    expect(second).not.toBe(first);
    expect(stop).toHaveBeenCalledOnce();
    expect(start).toHaveBeenLastCalledWith(second);
    expect(
      await screen.findByText(
        `http://192.168.1.20:4120/remote#token=${second}`,
      ),
    ).toBeTruthy();
  });
});
