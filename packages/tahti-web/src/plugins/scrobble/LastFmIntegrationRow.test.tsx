// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../api/integrations';
import { LastFmIntegrationRow } from './LastFmIntegrationRow';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

describe('LastFmIntegrationRow own API key', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.spyOn(api, 'fetchMeIntegrations').mockResolvedValue({
      data: [],
      source: 'api',
    });
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign, search: '', origin: 'https://x' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    assign.mockReset();
  });

  it('starts Last.fm sign-in with the pasted key pair', async () => {
    const prepare = vi.spyOn(api, 'prepareLastFmWithOwnKey').mockResolvedValue({
      ok: true,
      authUrl: 'https://www.last.fm/api/auth/?token=t',
    });
    await act(async () => {
      render(<LastFmIntegrationRow />);
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Use your own Last.fm API key' }),
    );
    fireEvent.change(screen.getByLabelText('Last.fm API key'), {
      target: { value: 'key' },
    });
    fireEvent.change(screen.getByLabelText('Shared secret'), {
      target: { value: 'secret' },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Connect with my key' }),
      );
    });
    expect(prepare).toHaveBeenCalledWith({
      apiKey: 'key',
      apiSecret: 'secret',
      returnTo: 'https://x/settings/integrations',
    });
    expect(assign).toHaveBeenCalledWith(
      'https://www.last.fm/api/auth/?token=t',
    );
  });
});
