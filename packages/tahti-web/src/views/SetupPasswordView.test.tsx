// @vitest-environment jsdom
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as client from '../api/client';
import type { AuthUser } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { renderWithRouter } from '../test/renderWithRouter';
import { SetupPasswordView } from './SetupPasswordView';

beforeEach(() => {
  window.history.replaceState({}, '', '/setup-password?token=used-token');
  useAuthStore.setState({ user: null, error: null, loading: false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.setState({ user: null });
});

describe('SetupPasswordView', () => {
  it('explains a dead link with an error banner and what to do next', async () => {
    vi.spyOn(client, 'fetchSetupPasswordInfo').mockResolvedValue({
      ok: false,
      error: 'Invalid or expired setup link',
    } as Awaited<ReturnType<typeof client.fetchSetupPasswordInfo>>);
    await renderWithRouter(<SetupPasswordView />, {
      paths: ['/login', '/forgot-password'],
    });

    const banner = await screen.findByTestId('setup-link-error');
    expect(banner).toHaveTextContent('This setup link no longer works');
    expect(banner).toHaveTextContent('Send yourself a new link');
    expect(
      within(banner).getByRole('link', { name: /Log in/ }),
    ).toHaveAttribute('href', '/login');
    expect(
      within(banner).getByRole('link', { name: /Send me a new link/ }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('says you are signed in instead of reporting the used link as an error', async () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'tahti' } as AuthUser,
    });
    vi.spyOn(client, 'fetchSetupPasswordInfo').mockResolvedValue({
      ok: false,
      error: 'Invalid or expired setup link',
    } as Awaited<ReturnType<typeof client.fetchSetupPasswordInfo>>);
    await renderWithRouter(<SetupPasswordView />, { paths: ['/studio'] });

    expect(
      await screen.findByTestId('setup-already-signed-in'),
    ).toHaveTextContent('You are signed in');
    expect(screen.queryByTestId('setup-link-error')).toBeNull();
  });

  it('checks the link once, even when the page re-renders', async () => {
    const info = vi.spyOn(client, 'fetchSetupPasswordInfo').mockResolvedValue({
      ok: true,
      email: 'tahti@tahti.live',
      displayName: 'Tahti',
    } as Awaited<ReturnType<typeof client.fetchSetupPasswordInfo>>);
    await renderWithRouter(<SetupPasswordView />);
    await screen.findByText(/Welcome, Tahti/);

    useAuthStore.setState({ loading: true });
    useAuthStore.setState({ loading: false });

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('used-token');
  });
});
