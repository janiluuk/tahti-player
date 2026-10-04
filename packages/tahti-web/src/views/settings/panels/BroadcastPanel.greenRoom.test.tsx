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
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as settings from '../../../api/artist-settings';
import * as studioExtras from '../../../api/studio-extras';
import { BroadcastPanel } from './BroadcastPanel';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

async function renderGreenRoom() {
  vi.spyOn(studioExtras, 'fetchProgramme').mockResolvedValue({
    data: null,
    meta: { source: 'api' },
  } as never);
  vi.spyOn(settings, 'fetchModerators').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  } as never);
  vi.spyOn(settings, 'fetchGreenRoomPrefs').mockResolvedValue({
    data: { defaultEnabled: false, invitePool: 'MODERATORS_AND_SUBS' },
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <BroadcastPanel section="green-room" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('BroadcastPanel green room', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('saves the open-on-go-live default and the invite pool', async () => {
    const patch = vi.spyOn(settings, 'patchGreenRoomPrefs').mockResolvedValue({
      ok: true,
      data: { defaultEnabled: true, invitePool: 'MODERATORS_AND_SUBS' },
    });
    await renderGreenRoom();
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Open the green room when I go live',
      }),
    );
    expect(patch).toHaveBeenCalledWith({ defaultEnabled: true });
    fireEvent.click(screen.getByText('Only people I invite'));
    expect(patch).toHaveBeenLastCalledWith({ invitePool: 'MANUAL_ONLY' });
    expect(screen.queryByLabelText('Default show title')).toBeNull();
  });

  it('puts the switch back and says why when the save fails', async () => {
    vi.spyOn(settings, 'patchGreenRoomPrefs').mockResolvedValue({
      ok: false,
      error: 'Could not save green room settings',
    });
    await renderGreenRoom();
    const toggle = screen.getByRole('switch', {
      name: 'Open the green room when I go live',
    });
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toast.error).toHaveBeenCalledWith(
      'Could not save green room settings',
    );
  });
});
