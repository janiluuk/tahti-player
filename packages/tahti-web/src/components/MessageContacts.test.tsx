// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/message-contacts';
import { MessageContacts } from './MessageContacts';

const contact = (n: number): api.MessageContact => ({
  username: `user-${n}`,
  displayName: `User ${n}`,
  avatarUrl: null,
  followsYou: n % 2 === 0,
  followedByYou: true,
});

async function renderContacts(
  contacts: api.MessageContact[],
  onPick = vi.fn(),
) {
  vi.spyOn(api, 'fetchMessageContacts').mockResolvedValue({
    data: contacts,
    meta: { source: 'api' },
  });
  const result = await act(async () =>
    render(<MessageContacts onPick={onPick} />),
  );
  return { ...result, onPick };
}

describe('MessageContacts', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('starts a conversation with a picked contact', async () => {
    const { onPick } = await renderContacts([contact(1), contact(2)]);
    const button = screen.getByRole('button', { name: 'Message User 2' });
    expect(button.getAttribute('title')).toBe('You follow each other');
    fireEvent.click(button);
    expect(onPick).toHaveBeenCalledWith('user-2');
  });

  it('shows the first twelve and the rest on request', async () => {
    await renderContacts(Array.from({ length: 15 }, (_, i) => contact(i)));
    const list = screen.getByTestId('message-contacts');
    expect(within(list).getAllByRole('listitem')).toHaveLength(12);
    fireEvent.click(screen.getByRole('button', { name: 'Show all 15' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(15);
  });

  it('renders nothing without contacts', async () => {
    const { container } = await renderContacts([]);
    expect(container.textContent).toBe('');
  });
});
