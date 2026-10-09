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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/chat-moderation';
import { useAuthStore } from '../stores/authStore';
import { ModerateChannelView } from './ModerateChannelView';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('../components/moderation/ChatMessagesPanel', () => ({
  ChatMessagesPanel: ({ slug }: { slug: string }) => (
    <div>messages of {slug}</div>
  ),
}));
vi.mock('../components/moderation/ChatBansPanel', () => ({
  ChatBansPanel: ({ slug }: { slug: string }) => <div>bans of {slug}</div>,
}));

const CHANNELS: api.ModeratedChannel[] = [
  { slug: 'mine', displayName: 'My Channel', isOwner: true },
  { slug: 'night-drive', displayName: 'Night Drive', isOwner: false },
];

async function renderView(slug: string) {
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ModerateChannelView slug={slug} />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('ModerateChannelView', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'listener' } as never,
      hydrated: true,
    });
    vi.spyOn(api, 'fetchModeratedChannels').mockResolvedValue({
      ok: true,
      data: CHANNELS,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, hydrated: true });
  });

  it('shows a moderator without a channel the messages and bans of the channel', async () => {
    await renderView('night-drive');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Night Drive: chat' }),
    ).toBeTruthy();
    expect(screen.getByText('messages of night-drive')).toBeTruthy();
    expect(screen.getByText('bans of night-drive')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Stop moderating' }),
    ).toBeTruthy();
  });

  it('steps down after a confirm', async () => {
    const stop = vi
      .spyOn(api, 'stopModerating')
      .mockResolvedValue({ ok: true });
    await renderView('night-drive');
    fireEvent.click(screen.getByRole('button', { name: 'Stop moderating' }));
    expect(stop).not.toHaveBeenCalled();
    expect(screen.getByText('Stop moderating Night Drive?')).toBeTruthy();
    const buttons = screen.getAllByRole('button', {
      name: 'Stop moderating',
      hidden: true,
    });
    await act(async () => {
      fireEvent.click(buttons[buttons.length - 1]);
    });
    expect(stop).toHaveBeenCalledWith('night-drive');
    expect(toast.success).toHaveBeenCalledWith(
      'You no longer moderate Night Drive.',
    );
  });

  it('offers the owner no way to step down from their own channel', async () => {
    await renderView('mine');
    expect(screen.getByText('messages of mine')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: 'Stop moderating' }),
    ).toBeNull();
  });

  it('says so when the account does not moderate the channel', async () => {
    await renderView('somebody-else');
    expect(screen.getByText("You don't moderate this channel")).toBeTruthy();
    expect(screen.queryByText('messages of somebody-else')).toBeNull();
  });

  it('asks a signed-out visitor to sign in and loads nothing', async () => {
    useAuthStore.setState({ user: null, hydrated: true });
    await renderView('night-drive');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeTruthy();
    expect(api.fetchModeratedChannels).not.toHaveBeenCalled();
  });

  it('offers a retry when the list of channels cannot be loaded', async () => {
    vi.mocked(api.fetchModeratedChannels).mockResolvedValueOnce({
      ok: false,
      error: 'Network down',
    });
    await renderView('night-drive');
    expect(screen.getByText('Network down')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    });
    expect(screen.getByText('messages of night-drive')).toBeTruthy();
  });
});
