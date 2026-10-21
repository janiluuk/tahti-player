import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchReactionsToken } from '../api/chat-reactions';
import { postChatReaction } from '../api/studio-extras';
import { ChatReactionBar } from './ChatReactionBar';

vi.mock('../api/chat-reactions', () => ({ fetchReactionsToken: vi.fn() }));
vi.mock('../api/studio-extras', () => ({ postChatReaction: vi.fn() }));

class FakeSocket {
  static last: FakeSocket | null = null;
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    FakeSocket.last = this;
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
}

describe('ChatReactionBar', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', FakeSocket);
    vi.mocked(fetchReactionsToken).mockResolvedValue('anon-token');
    vi.mocked(postChatReaction).mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    FakeSocket.last = null;
  });

  it("subscribes to the channel's reactions and shows what listeners send", async () => {
    await act(async () => {
      render(<ChatReactionBar slug="night-drive" onError={vi.fn()} />);
    });
    const ws = FakeSocket.last!;
    expect(fetchReactionsToken).toHaveBeenCalledWith('night-drive');

    act(() => {
      ws.onopen?.();
      ws.onmessage?.({ data: JSON.stringify({ id: 1, connect: {} }) });
    });
    expect(ws.sent).toEqual([
      { id: 1, connect: { token: 'anon-token' } },
      { id: 2, subscribe: { channel: 'reactions:night-drive' } },
    ]);

    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({
          push: {
            channel: 'reactions:night-drive',
            pub: { data: { emoji: '🔥' } },
          },
        }),
      });
    });
    expect(screen.getByTestId('incoming-reactions')).toHaveTextContent('🔥');
  });

  it('sends a reaction and confirms it', async () => {
    await act(async () => {
      render(<ChatReactionBar slug="night-drive" onError={vi.fn()} />);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'React with fire' }));
    });
    expect(postChatReaction).toHaveBeenCalledWith('night-drive', '🔥');
    expect(screen.getByRole('status')).toHaveTextContent('Sent 🔥');
  });
});
