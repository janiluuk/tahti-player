import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ServiceAction, ServicePlugin } from '../serviceCatalog';
import { OAuthServiceCard } from './OAuthServiceCard';

const { toast, adapter } = vi.hoisted(() => ({
  toast: { error: vi.fn(), success: vi.fn() },
  adapter: {
    id: 'soundcloud',
    oauthUrl: '/api/me/soundcloud/oauth/start',
    checkStatus: vi.fn(),
    disconnect: vi.fn(),
    listTracks: vi.fn(),
    importTracks: vi.fn(),
  },
}));

vi.mock('sonner', () => ({ toast, Toaster: () => null }));
vi.mock('../../../plugins/import-sources', () => ({
  oauthAdapterFor: () => adapter,
}));
vi.mock('../../../api/studio-extras', () => ({
  fetchMeProfile: vi.fn().mockResolvedValue({ data: { socialLinks: {} } }),
  patchMeProfile: vi.fn(),
}));

const plugin = {
  id: 'soundcloud',
  name: 'SoundCloud',
  author: 'Tahti',
  description: '',
} as unknown as ServicePlugin;
const action = {
  kind: 'oauth',
  integrationId: 'soundcloud',
  oauthPath: '/api/me/soundcloud/oauth/start',
} as unknown as Extract<ServiceAction, { kind: 'oauth' }>;

const open = async () => {
  const gears = await screen.findAllByRole('button', { name: 'Configure' });
  fireEvent.click(gears[gears.length - 1]!);
};

const startHref = window.location.href;

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  adapter.listTracks.mockResolvedValue({ data: [] });
});

describe('OAuthServiceCard connecting', () => {
  it('does not send the artist to a provider the server has not set up', async () => {
    adapter.checkStatus.mockResolvedValue({
      data: { connected: false, configured: false },
    });
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await waitFor(() => expect(adapter.checkStatus).toHaveBeenCalled());

    fireEvent.click(await screen.findByRole('button', { name: /Connect/ }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'SoundCloud is not set up on this server yet.',
      ),
    );
    expect(window.location.href).toBe(startHref);
    await open();
    expect(
      await screen.findByText(
        'SoundCloud is not set up on this server yet, so it cannot be connected.',
      ),
    ).toBeTruthy();
  });

  it('says the status could not be read instead of "not connected"', async () => {
    adapter.checkStatus.mockResolvedValue({
      data: { connected: false, configured: false, unavailable: true },
    });
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await open();

    expect(
      await screen.findByText(
        'Could not check this connection. Try again in a moment.',
      ),
    ).toBeTruthy();
  });

  it('falls back to Connect when the SoundCloud connection has expired', async () => {
    adapter.checkStatus
      .mockResolvedValueOnce({ data: { connected: true, configured: true } })
      .mockResolvedValue({ data: { connected: false, configured: true } });
    adapter.listTracks.mockResolvedValue({ data: [], needsReconnect: true });
    render(<OAuthServiceCard plugin={plugin} action={action} />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Your SoundCloud connection expired. Connect again.',
      ),
    );
    await waitFor(() => expect(adapter.checkStatus).toHaveBeenCalledTimes(2));
    await open();
    expect(await screen.findByText('Not connected yet.')).toBeTruthy();
  });

  it('an account with nothing downloadable says so', async () => {
    adapter.checkStatus.mockResolvedValue({
      data: { connected: true, configured: true },
    });
    render(<OAuthServiceCard plugin={plugin} action={action} />);
    await open();

    expect(
      await screen.findByText(
        'No downloadable tracks on this SoundCloud account.',
      ),
    ).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
