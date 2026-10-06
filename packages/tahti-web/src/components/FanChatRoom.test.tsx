import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchFanChatHistory, requestFanChatToken } from '../api/fan-chat';
import { FanChatRoom } from './FanChatRoom';

vi.mock('../api/fan-chat', () => ({
  fetchFanChatHistory: vi.fn(),
  requestFanChatToken: vi.fn(),
}));

class FakeSocket {
  static last: FakeSocket | null = null;
  sent: Array<Record<string, unknown>> = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    FakeSocket.last = this;
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
}

const room = 'channel:night-drive:fans';

async function openRoom() {
  await act(async () => {
    render(<FanChatRoom slug="night-drive" onLeave={vi.fn()} />);
  });
  const ws = FakeSocket.last!;
  act(() => {
    ws.onopen?.();
    ws.onmessage?.({ data: JSON.stringify({ id: 1, connect: {} }) });
  });
  return ws;
}

describe('FanChatRoom', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.mocked(fetchFanChatHistory).mockResolvedValue([]);
    vi.mocked(requestFanChatToken).mockResolvedValue({
      ok: true,
      data: { token: 'fan-token', handle: 'Aino', channel: room },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    FakeSocket.last = null;
  });

  it('joins the fan channel and shows its messages', async () => {
    const ws = await openRoom();
    expect(requestFanChatToken).toHaveBeenCalledWith('night-drive');
    expect(ws.sent).toEqual([
      { id: 1, connect: { token: 'fan-token' } },
      { id: 2, subscribe: { channel: room } },
    ]);

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          push: {
            channel: room,
            pub: { data: { handle: 'Ville', text: 'hei' } },
          },
        }),
      });
    });
    expect(screen.getByText('hei')).toBeInTheDocument();
  });

  it('starts with the recent fan-room messages', async () => {
    vi.mocked(fetchFanChatHistory).mockResolvedValue([
      { handle: 'Ville', text: 'earlier tonight', ts: 1 },
    ]);
    await openRoom();
    expect(fetchFanChatHistory).toHaveBeenCalledWith('night-drive');
    expect(screen.getByText('earlier tonight')).toBeInTheDocument();
  });

  it('publishes to the fan channel under the handle the API gave', async () => {
    const ws = await openRoom();
    fireEvent.change(screen.getByLabelText('Message the fan room'), {
      target: { value: 'thanks all' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(ws.sent[2]).toMatchObject({
      publish: { channel: room, data: { handle: 'Aino', text: 'thanks all' } },
    });
  });

  it('explains when the API refuses the room', async () => {
    vi.mocked(requestFanChatToken).mockResolvedValue({
      ok: false,
      error: 'Active fan subscription with FAN_CHAT perk required',
    });
    await act(async () => {
      render(<FanChatRoom slug="night-drive" onLeave={vi.fn()} />);
    });
    expect(
      screen.getByText('Active fan subscription with FAN_CHAT perk required'),
    ).toBeInTheDocument();
  });

  it('says so when a post is refused', async () => {
    const ws = await openRoom();
    fireEvent.change(screen.getByLabelText('Message the fan room'), {
      target: { value: 'still here?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const publishId = ws.sent[2]!.id;

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          id: publishId,
          error: { code: 403, message: 'fan_chat_required' },
        }),
      });
    });

    expect(
      screen.getByText('The fan room is for fan subscribers.'),
    ).toBeInTheDocument();
  });

  it('comes back with a new token after the connection drops', async () => {
    const first = await openRoom();
    vi.mocked(requestFanChatToken).mockResolvedValue({
      ok: true,
      data: { token: 'next-fan-token', handle: 'Aino', channel: room },
    });
    vi.useFakeTimers();
    try {
      act(() => {
        first.onclose?.();
      });
      expect(screen.getByText('Connecting…')).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      const second = FakeSocket.last!;
      expect(second).not.toBe(first);
      act(() => {
        second.onopen?.();
        second.onmessage?.({ data: JSON.stringify({ id: 9, connect: {} }) });
      });

      expect(second.sent[0]).toMatchObject({
        connect: { token: 'next-fan-token' },
      });
      expect(screen.getByText('Subscribers only')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops retrying once the room is left', async () => {
    const first = await openRoom();
    vi.useFakeTimers();
    try {
      act(() => {
        first.onclose?.();
      });
      const calls = vi.mocked(requestFanChatToken).mock.calls.length;
      cleanup();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10000);
      });
      expect(vi.mocked(requestFanChatToken).mock.calls.length).toBe(calls);
    } finally {
      vi.useRealTimers();
    }
  });
});
