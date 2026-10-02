// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../../stores/authStore';
import { ChannelPanel } from './ChannelPanel';

const api = vi.hoisted(() => ({
  fetchMeProfile: vi.fn(),
  patchMeProfile: vi.fn(),
}));

vi.mock('../../../api/studio-extras', () => api);
vi.mock('../../studio/StudioBrandingView', () => ({
  StudioBrandingPanel: () => null,
}));
vi.mock('../../studio/StudioModerationView', () => ({
  StudioModerationView: () => null,
}));

const profile = {
  id: 'u1',
  username: 'artist',
  displayName: 'Artist',
  chatEnabled: true,
  socialLinks: { website: 'https://example.com', genres: 'House' },
};

async function openDiscovery() {
  await act(async () => {
    render(<ChannelPanel />);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('tab', { name: /Discovery/ }));
  });
}

describe('ChannelPanel discovery', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: 'u1',
        username: 'artist',
        channel: { slug: 'artist' },
      } as never,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('saves genres into the profile links and keeps the other links', async () => {
    api.fetchMeProfile.mockResolvedValue({
      data: profile,
      meta: { source: 'api' },
    });
    api.patchMeProfile.mockResolvedValue({ ok: true, data: profile });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await openDiscovery();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Techno' }));
    });
    expect(api.patchMeProfile).toHaveBeenCalledWith({
      socialLinks: { website: 'https://example.com', genres: 'House, Techno' },
    });
    expect(
      fetchSpy.mock.calls.some(([url]) => String(url).includes('discovery')),
    ).toBe(false);
  });

  it('shows the unsupported discovery switches as coming soon', async () => {
    api.fetchMeProfile.mockResolvedValue({
      data: profile,
      meta: { source: 'api' },
    });
    await openDiscovery();

    for (const name of [
      'List in Listen directory',
      'Allow Tahti Radio pickup',
      'Featured on Listen home',
    ]) {
      const toggle = screen.getByRole('switch', { name });
      expect(
        toggle.hasAttribute('disabled') ||
          toggle.getAttribute('aria-disabled') === 'true',
      ).toBe(true);
    }
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });

  it('does not write genres over links it could not load', async () => {
    api.fetchMeProfile.mockResolvedValue({
      data: { ...profile, socialLinks: {} },
      meta: { source: 'api', reason: 'Network error' },
    });
    await openDiscovery();

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Techno' }));
    });
    expect(api.patchMeProfile).not.toHaveBeenCalled();
  });
});
