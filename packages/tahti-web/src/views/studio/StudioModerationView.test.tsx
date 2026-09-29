// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as artistSettings from '../../api/artist-settings';
import { useAuthStore } from '../../stores/authStore';
import { StudioModerationView } from './StudioModerationView';

vi.mock('../../components/StudioGate', () => ({
  StudioGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
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
  vi.spyOn(artistSettings, 'fetchModerators').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  });
  vi.spyOn(artistSettings, 'fetchChatBans').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAuthStore.setState({ user: null, hydrated: true, loading: false });
});

describe('StudioModerationView chat access', () => {
  it('turns subscribers-only chat on', async () => {
    vi.spyOn(artistSettings, 'fetchChatSettings').mockResolvedValue({
      data: { subscribersOnly: false },
      meta: { source: 'api' },
    });
    const save = vi
      .spyOn(artistSettings, 'setChatSubscribersOnly')
      .mockResolvedValue({ ok: true, subscribersOnly: true });
    await act(async () => {
      render(<StudioModerationView embedded />);
    });

    const toggle = screen.getByRole('switch', {
      name: 'Only fan subscribers can post',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(save).toHaveBeenCalledWith(true);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('hides the setting when it cannot be loaded', async () => {
    vi.spyOn(artistSettings, 'fetchChatSettings').mockResolvedValue({
      data: null,
      meta: { source: 'api' },
    });
    await act(async () => {
      render(<StudioModerationView embedded />);
    });
    expect(screen.queryByText('Chat access')).toBeNull();
  });
});
