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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as security from '../../../api/security';
import type { AuthUser } from '../../../api/types';
import { useAuthStore } from '../../../stores/authStore';
import { useSettingsModalStore } from '../../../stores/settingsModalStore';
import { AccountOverview } from './AccountOverview';

const listener = {
  username: 'liina',
  displayName: 'Liina',
  email: 'liina@example.com',
} as AuthUser;

async function renderOverview() {
  const router = createRouter({
    routeTree: createRootRoute({ component: () => <AccountOverview /> }),
    history: createMemoryHistory({ initialEntries: ['/settings/account'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('AccountOverview', () => {
  beforeEach(() => {
    vi.spyOn(security, 'fetchTotpStatus').mockResolvedValue({
      data: { enabled: false },
      meta: { source: 'api' },
    } as Awaited<ReturnType<typeof security.fetchTotpStatus>>);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('lists the account settings with their state and a way to each', async () => {
    useAuthStore.setState({ user: listener });
    await renderOverview();

    expect(screen.getByText('liina@example.com')).toBeTruthy();
    expect((await screen.findByTestId('account-2fa-status')).textContent).toBe(
      'Two-factor off',
    );
    for (const name of [
      'Manage Email',
      'Manage Sign-in and security',
      'Manage Devices',
      'Manage Language',
      'Manage Your data',
    ]) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.queryByTestId('account-edit-artist-profile')).toBeNull();
  });

  it('opens the section where a setting is changed', async () => {
    useAuthStore.setState({ user: listener });
    await renderOverview();

    fireEvent.click(screen.getByRole('button', { name: 'Manage Devices' }));
    expect(useSettingsModalStore.getState().activeTab).toBe('security');
    expect(useSettingsModalStore.getState().securitySection).toBe('devices');

    fireEvent.click(screen.getByRole('button', { name: 'Manage Your data' }));
    expect(useSettingsModalStore.getState().activeTab).toBe('account');
    expect(useSettingsModalStore.getState().accountSection).toBe('privacy');

    fireEvent.click(screen.getByTestId('account-edit-profile'));
    expect(useSettingsModalStore.getState().activeTab).toBe('artist');
  });

  it('links an artist to Studio → Profile to edit their profile', async () => {
    useAuthStore.setState({
      user: {
        ...listener,
        channel: { slug: 'liina', state: 'LIVE' },
      } as AuthUser,
    });
    await renderOverview();

    expect(
      screen.getByTestId('account-edit-artist-profile').getAttribute('href'),
    ).toBe('/studio/profile');
    expect(screen.queryByTestId('account-edit-profile')).toBeNull();
  });
});
