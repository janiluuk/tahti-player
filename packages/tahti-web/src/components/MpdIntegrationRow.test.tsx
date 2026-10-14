import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDesktopMpdStore } from '../lib/mpd/desktop';
import { MpdIntegrationRow } from './MpdIntegrationRow';

beforeEach(() => {
  localStorage.clear();
  useDesktopMpdStore.setState({
    enabled: false,
    url: null,
    error: null,
    busy: false,
  });
});

afterEach(() => {
  globalThis.__TAHTI_NATIVE_MPD__ = undefined;
});

describe('MpdIntegrationRow', () => {
  it('starts the server, shows its address and remembers it is on', async () => {
    const start = vi.fn(async () => 6601);
    globalThis.__TAHTI_NATIVE_MPD__ = {
      start,
      stop: vi.fn(async () => {}),
      notify: vi.fn(),
    };
    render(<MpdIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'MPD server' }));
    expect(await screen.findByText('127.0.0.1:6601')).toBeTruthy();
    expect(localStorage.getItem('tahti-desktop-mpd-enabled')).toBe('1');
  });

  it('says why the server could not start and stays off', async () => {
    globalThis.__TAHTI_NATIVE_MPD__ = {
      start: async () => {
        throw new Error('All ports 6600-6609 are taken');
      },
      stop: async () => {},
      notify: vi.fn(),
    };
    render(<MpdIntegrationRow />);
    fireEvent.click(screen.getByRole('switch', { name: 'MPD server' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'The MPD server could not start: All ports 6600-6609 are taken',
    );
    expect(useDesktopMpdStore.getState().enabled).toBe(false);
  });
});
