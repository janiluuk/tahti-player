// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/sessions';
import { DevicesSessionsPanel } from './DevicesSessionsPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderPanel() {
  vi.spyOn(api, 'fetchDeviceSessions').mockResolvedValue({
    data: [
      {
        id: 'here',
        deviceLabel: 'Firefox on Linux',
        createdAt: '2026-10-01T00:00:00.000Z',
        lastUsedAt: null,
        current: true,
      },
      {
        id: 'phone',
        deviceLabel: 'Safari on iPhone',
        createdAt: '2026-10-02T00:00:00.000Z',
        lastUsedAt: '2026-10-02T09:00:00.000Z',
        current: false,
      },
    ],
    meta: { source: 'api' },
  });
  await act(async () => {
    render(<DevicesSessionsPanel />);
  });
}

describe('DevicesSessionsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T12:00:00.000Z'));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('shows when each device signed in and was last active', async () => {
    await renderPanel();
    const signedIn = screen.getByText('1 day ago');
    expect(signedIn.tagName).toBe('TIME');
    expect(signedIn.getAttribute('datetime')).toBe('2026-10-01T00:00:00.000Z');
    expect(screen.getByText('12 hours ago')).toBeTruthy();
    expect(screen.getByText('3 hours ago').getAttribute('datetime')).toBe(
      '2026-10-02T09:00:00.000Z',
    );
  });

  it('confirms signing out one device with a red button', async () => {
    await renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    const dialog = within(
      screen.getByRole('dialog', { name: 'Sign out this device?' }),
    );
    expect(
      dialog.getByRole('button', { name: 'Sign out' }).className,
    ).toContain('bg-accent-red');
  });

  it('confirms signing out everywhere with a red button', async () => {
    await renderPanel();
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign out everywhere' }),
    );
    const dialog = within(
      screen.getByRole('dialog', { name: 'Sign out everywhere?' }),
    );
    expect(
      dialog.getByRole('button', { name: 'Sign out everywhere' }).className,
    ).toContain('bg-accent-red');
  });
});
