import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestFanChatToken } from '../api/fan-chat';
import { FanChatRoom } from './FanChatRoom';

vi.mock('../api/fan-chat', () => ({ requestFanChatToken: vi.fn() }));

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
});
