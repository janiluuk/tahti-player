// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ChatDm } from '../api/messages';
import { DmThreadMessages } from './DmThreadMessages';

const dm = (id: string): ChatDm => ({
  id,
  senderUsername: 'aino',
  senderDisplayName: 'Aino',
  senderAvatarUrl: null,
  body: `message ${id}`,
  createdAt: '2026-10-01T10:00:00.000Z',
  isMine: false,
});

describe('DmThreadMessages', () => {
  afterEach(cleanup);

  it('offers older messages only when there are more', () => {
    const { rerender } = render(
      <DmThreadMessages
        messages={[dm('m1')]}
        hasMore={false}
        loadingOlder={false}
        onLoadOlder={() => {}}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Load older messages' }),
    ).toBeNull();
    rerender(
      <DmThreadMessages
        messages={[dm('m1')]}
        hasMore
        loadingOlder={false}
        onLoadOlder={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Load older messages' }),
    ).toBeTruthy();
  });

  it('keeps the reader in place when older messages are prepended', () => {
    const onLoadOlder = vi.fn();
    const { container, rerender } = render(
      <DmThreadMessages
        messages={[dm('m3')]}
        hasMore
        loadingOlder={false}
        onLoadOlder={onLoadOlder}
      />,
    );
    const list = container.firstElementChild as HTMLDivElement;
    let height = 500;
    Object.defineProperty(list, 'scrollHeight', { get: () => height });
    list.scrollTop = 0;

    fireEvent.click(
      screen.getByRole('button', { name: 'Load older messages' }),
    );
    expect(onLoadOlder).toHaveBeenCalledOnce();

    height = 800;
    rerender(
      <DmThreadMessages
        messages={[dm('m1'), dm('m2'), dm('m3')]}
        hasMore={false}
        loadingOlder={false}
        onLoadOlder={onLoadOlder}
      />,
    );
    expect(list.scrollTop).toBe(300);
    expect(
      screen.getAllByText(/^message m/).map((n) => n.lastChild?.textContent),
    ).toEqual(['message m1', 'message m2', 'message m3']);
  });
});
