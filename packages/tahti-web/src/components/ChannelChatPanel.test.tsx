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

import {
  fetchChatAccess,
  fetchChatHistory,
  requestChatToken,
  requestChatViewerToken,
} from '../api/client';
import type { ChatAccess } from '../api/types';
import { ChannelChatPanel } from './ChannelChatPanel';

vi.mock('../api/client', () => ({
  fetchChatAccess: vi.fn(),
  fetchChatHistory: vi.fn(),
  requestChatToken: vi.fn(),
  requestChatViewerToken: vi.fn(),
}));
vi.mock('./ChatDailyListeners', () => ({ ChatDailyListeners: () => null }));
vi.mock('./ChatListeningNow', () => ({ ChatListeningNow: () => null }));
vi.mock('./ChatReactionBar', () => ({ ChatReactionBar: () => null }));
vi.mock('./FanChatRoom', () => ({ FanChatRoom: () => null }));

class FakeSocket {
  static last: FakeSocket | null = null;
  sent: Array<{ id: number }> = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    FakeSocket.last = this;
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
}

const BASE_ACCESS: ChatAccess = {
  fanChatEnabled: false,
  isSupporter: false,
  canJoinFanChat: false,
  subscribersOnly: false,
  canPostInChat: true,
};

async function renderPanel(access: Partial<ChatAccess> = {}) {
  vi.mocked(fetchChatAccess).mockResolvedValue({
    data: { ...BASE_ACCESS, ...access },
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <ChannelChatPanel slug="night-drive" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

async function join() {
  fireEvent.change(screen.getByLabelText('Handle'), {
    target: { value: 'nightowl' },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Join chat' }));
  });
}

describe('ChannelChatPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeSocket);
    localStorage.clear();
    vi.mocked(fetchChatHistory).mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    vi.mocked(requestChatViewerToken).mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    FakeSocket.last = null;
  });

  it('says chat is off instead of offering the join form', async () => {
    await renderPanel({ chatEnabled: false });
    expect(screen.getByText('The artist has turned chat off.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Join chat' })).toBe(null);
  });

  it('keeps the join form when the API does not say whether chat is on', async () => {
    await renderPanel();
    expect(screen.getByRole('button', { name: 'Join chat' })).toBeTruthy();
  });

  it('links a subscribers-only refusal to the artist subscribe page', async () => {
    vi.mocked(requestChatToken).mockRejectedValue(
      new Error('subscribers_only'),
    );
    await renderPanel({ artistUsername: 'nightdrive' });
    await join();
    expect(
      screen.getByText('Only fan subscribers can post in this chat.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Subscribe' }).getAttribute('href'),
    ).toBe('/subscribe/nightdrive');
    expect(screen.queryByText(/subscribers_only/)).toBe(null);
  });

  it('switches to the chat-off note when joining finds chat turned off', async () => {
    vi.mocked(requestChatToken).mockRejectedValue(new Error('chat_disabled'));
    await renderPanel();
    await join();
    expect(screen.getByText('The artist has turned chat off.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Join chat' })).toBe(null);
    expect(screen.queryByText(/chat_disabled/)).toBe(null);
  });

  it('shows a plain message for an unknown error code', async () => {
    vi.mocked(requestChatToken).mockRejectedValue(new Error('weird_code'));
    await renderPanel();
    await join();
    expect(
      screen.getByText('Could not join chat. Try again in a moment.'),
    ).toBeTruthy();
    expect(screen.queryByText(/weird_code/)).toBe(null);
  });

  it('links the owner and moderators to the moderation page, and nobody else', async () => {
    vi.mocked(requestChatToken).mockResolvedValue({
      data: { token: 't', handle: 'nightowl', channelRole: 'moderator' },
      meta: { source: 'api' },
    });
    await renderPanel();
    expect(screen.queryByRole('link', { name: 'Moderate' })).toBe(null);
    await join();
    expect(
      screen.getByRole('link', { name: 'Moderate' }).getAttribute('href'),
    ).toBe('/moderate/night-drive');
    cleanup();

    vi.mocked(requestChatToken).mockResolvedValue({
      data: { token: 't', handle: 'nightowl', channelRole: null },
      meta: { source: 'api' },
    });
    await renderPanel();
    await join();
    expect(screen.queryByRole('link', { name: 'Moderate' })).toBe(null);
  });

  it('sends the listener back to the captcha when a post needs one', async () => {
    vi.mocked(requestChatToken).mockResolvedValue({
      data: { token: 'publish-token', handle: 'nightowl' },
      meta: { source: 'api' },
    });
    await renderPanel();
    await join();
    const ws = FakeSocket.last!;
    act(() => {
      ws.onopen?.();
      ws.onmessage?.({ data: JSON.stringify({ id: 1, connect: {} }) });
    });

    fireEvent.change(screen.getByPlaceholderText('Message as nightowl'), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const publishId = ws.sent[ws.sent.length - 1]!.id;

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          id: publishId,
          error: { code: 403, message: 'captcha_required' },
        }),
      });
    });
    expect(
      screen.getByText(
        'Please confirm you are not a bot again to keep chatting.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Join chat' })).toBeTruthy();
    expect((screen.getByLabelText('Handle') as HTMLInputElement).value).toBe(
      'nightowl',
    );
  });

  it('says a post was not sent when the server refuses it without a known code', async () => {
    vi.mocked(requestChatToken).mockResolvedValue({
      data: { token: 'publish-token', handle: 'nightowl' },
      meta: { source: 'api' },
    });
    await renderPanel();
    await join();
    const ws = FakeSocket.last!;
    act(() => {
      ws.onopen?.();
      ws.onmessage?.({ data: JSON.stringify({ id: 1, connect: {} }) });
    });
    fireEvent.change(screen.getByPlaceholderText('Message as nightowl'), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const publishId = ws.sent[ws.sent.length - 1]!.id;
    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          id: publishId,
          error: { code: 100, message: 'internal server error' },
        }),
      });
    });
    expect(
      screen.getByText('Your message was not sent. Try again in a moment.'),
    ).toBeTruthy();
  });

  describe('when the connection drops', () => {
    async function joinAndDrop(next: 'second-token' | Error) {
      const tokens = vi.mocked(requestChatToken).mockResolvedValueOnce({
        data: { token: 'first-token', handle: 'nightowl' },
        meta: { source: 'api' },
      });
      if (next instanceof Error) {
        tokens.mockRejectedValueOnce(next);
      } else {
        tokens.mockResolvedValueOnce({
          data: { token: next, handle: 'nightowl' },
          meta: { source: 'api' },
        });
      }
      await renderPanel();
      await join();
      const first = FakeSocket.last!;
      act(() => {
        first.onopen?.();
        first.onmessage?.({ data: JSON.stringify({ id: 1, connect: {} }) });
      });
      vi.useFakeTimers();
      act(() => {
        first.onclose?.();
      });
      return first;
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it('reconnects with a new token, since the old one may have run out', async () => {
      const first = await joinAndDrop('second-token');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(vi.mocked(requestChatToken)).toHaveBeenLastCalledWith(
        'night-drive',
        'nightowl',
        undefined,
      );
      const second = FakeSocket.last!;
      expect(second).not.toBe(first);
      act(() => {
        second.onopen?.();
      });
      expect(second.sent[0]).toMatchObject({
        connect: { token: 'second-token' },
      });
    });

    it('shows the join form again when the new token needs a captcha', async () => {
      const first = await joinAndDrop(
        new Error('hCaptcha verification failed'),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(FakeSocket.last).toBe(first);
      expect(
        screen.getByText(
          'The captcha check did not go through. Please try it again.',
        ),
      ).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Join chat' })).toBeTruthy();
    });

    it('retries with the token it has when the API cannot be reached', async () => {
      const first = await joinAndDrop(new Error('Failed to fetch'));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      const second = FakeSocket.last!;
      expect(second).not.toBe(first);
      act(() => {
        second.onopen?.();
      });
      expect(second.sent[0]).toMatchObject({
        connect: { token: 'first-token' },
      });
    });
  });
});
