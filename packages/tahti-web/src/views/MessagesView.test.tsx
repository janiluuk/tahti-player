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
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import * as blocks from '../api/blocks';
import * as contacts from '../api/message-contacts';
import * as api from '../api/messages';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { MessagesView } from './MessagesView';

const conversation = (
  channelRole?: api.ChannelStaffRole | null,
): api.ConversationSummary => ({
  id: 'c1',
  otherUser: {
    username: 'aino',
    displayName: 'Aino',
    avatarUrl: null,
    ...(channelRole === undefined ? {} : { channelRole }),
  },
  lastMessage: null,
  unreadCount: 0,
  updatedAt: '2026-10-01T10:00:00.000Z',
});

async function renderView(
  summary: api.ConversationSummary,
  messages: api.ChatDm[] = [],
  hasMore?: boolean,
  threadId: string | undefined = 'c1',
) {
  useAuthStore.setState({ user: { username: 'me' } as AuthUser });
  vi.spyOn(contacts, 'fetchMessageContacts').mockResolvedValue({
    data: [],
    meta: { source: 'api' },
  });
  vi.spyOn(api, 'fetchConversations').mockResolvedValue({
    data: [summary],
    meta: { source: 'api' },
  });
  vi.spyOn(api, 'fetchConversation').mockResolvedValue({
    data: { id: summary.id, otherUser: summary.otherUser, messages, hasMore },
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <MessagesView threadId={threadId} />,
    }),
    history: createMemoryHistory({
      initialEntries: [threadId ? `/messages/${threadId}` : '/messages'],
    }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

const dm = (
  id: string,
  isMine: boolean,
  senderChannelRole?: api.ChannelStaffRole | null,
): api.ChatDm => ({
  id,
  senderUsername: isMine ? 'me' : 'aino',
  senderDisplayName: isMine ? 'Me' : 'Aino',
  senderAvatarUrl: null,
  body: `message ${id}`,
  createdAt: '2026-10-01T10:00:00.000Z',
  isMine,
  ...(senderChannelRole === undefined ? {} : { senderChannelRole }),
});

describe('MessagesView role badges', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('marks an artist in the inbox, thread header and their messages', async () => {
    await renderView(conversation('owner'), [
      dm('m1', false, 'owner'),
      dm('m2', true, 'owner'),
    ]);
    const inboxRow = screen.getByRole('button', { name: /Aino/ });
    expect(within(inboxRow).getByText('Artist')).toBeTruthy();
    expect(screen.getAllByText('Artist')).toHaveLength(3);
  });

  it('keeps the empty thread pane off phones until a conversation is open', async () => {
    await renderView(conversation('ARTIST'), [], undefined, '');
    expect(screen.getByTestId('dm-thread').className).toContain('hidden');
    expect(screen.getByTestId('dm-thread').className).toContain('md:flex');
  });

  it('shows the thread pane at every width once a conversation is open', async () => {
    await renderView(conversation('ARTIST'), [dm('m1', false)]);
    expect(screen.getByTestId('dm-thread').className).not.toContain('hidden');
  });

  it('marks a moderator', async () => {
    await renderView(conversation('moderator'));
    expect(screen.getAllByText('Moderator')).toHaveLength(2);
  });

  it('shows no badge when the API omits the role or sends null', async () => {
    await renderView(conversation(), [dm('m1', false)]);
    expect(screen.queryByText('Artist')).toBeNull();
    expect(screen.queryByText('Moderator')).toBeNull();
    cleanup();
    await renderView(conversation(null), [dm('m1', false, null)]);
    expect(screen.queryByText('Artist')).toBeNull();
    expect(screen.queryByText('Moderator')).toBeNull();
  });
});

describe('MessagesView with an unavailable account', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('replaces the composer when the other account is gone', async () => {
    const summary = conversation();
    await renderView(
      { ...summary, otherUser: { ...summary.otherUser, available: false } },
      [dm('m1', false)],
    );
    expect(screen.getByText('message m1')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe(
      'This account is no longer available',
    );
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  it('switches to the notice when a send is refused', async () => {
    await renderView(conversation());
    const sendSpy = vi.spyOn(api, 'sendDm').mockResolvedValue({
      ok: false,
      error: api.RECIPIENT_UNAVAILABLE_MESSAGE,
      recipientUnavailable: true,
    });
    fireEvent.change(screen.getByPlaceholderText('Write a message…'), {
      target: { value: 'Still there?' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    });
    expect(sendSpy).toHaveBeenCalledWith('c1', 'Still there?');
    expect(screen.getByRole('status').textContent).toBe(
      'This account is no longer available',
    );
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });
});

describe('MessagesView older messages', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('loads the page before the oldest shown message', async () => {
    await renderView(conversation(), [dm('m3', false), dm('m4', true)], true);
    const older = vi.spyOn(api, 'fetchOlderMessages').mockResolvedValue({
      messages: [dm('m1', false), dm('m2', true)],
      hasMore: false,
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Load older messages' }),
      );
    });
    expect(older).toHaveBeenCalledWith('c1', 'm3');
    expect(
      screen.getAllByText(/^message m/).map((n) => n.lastChild?.textContent),
    ).toEqual(['message m1', 'message m2', 'message m3', 'message m4']);
    expect(
      screen.queryByRole('button', { name: 'Load older messages' }),
    ).toBeNull();
  });

  it('hides the button when the API does not say there are more', async () => {
    await renderView(conversation(), [dm('m1', false)]);
    expect(
      screen.queryByRole('button', { name: 'Load older messages' }),
    ).toBeNull();
  });

  it('blocks the other person after a confirm and closes the composer', async () => {
    vi.spyOn(blocks, 'fetchBlockedUsers').mockResolvedValue([]);
    const block = vi.spyOn(blocks, 'blockUser').mockResolvedValue({
      ok: true,
      data: {
        username: 'aino',
        displayName: 'Aino',
        avatarUrl: null,
        blockedAt: '2026-10-05T10:00:00.000Z',
      },
    });
    await renderView(conversation());
    expect(screen.getByPlaceholderText('Write a message…')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    expect(block).not.toHaveBeenCalled();
    expect(screen.getByText('Block Aino?')).toBeTruthy();
    const confirm = screen
      .getAllByRole('button', { name: 'Block' })
      .at(-1) as HTMLElement;
    await act(async () => {
      fireEvent.click(confirm);
    });
    expect(block).toHaveBeenCalledWith('aino');
    expect(screen.queryByPlaceholderText('Write a message…')).toBeNull();
    expect(screen.getByText(/You blocked this account/)).toBeTruthy();
    // The closing dialog still hides the page from role queries here.
    expect(screen.getByText('Unblock')).toBeTruthy();
  });

  it('shows an already blocked thread as blocked and unblocks it', async () => {
    vi.spyOn(blocks, 'fetchBlockedUsers').mockResolvedValue([
      {
        username: 'aino',
        displayName: 'Aino',
        avatarUrl: null,
        blockedAt: '2026-10-05T10:00:00.000Z',
      },
    ]);
    const unblock = vi
      .spyOn(blocks, 'unblockUser')
      .mockResolvedValue({ ok: true });
    await renderView(conversation());
    expect(screen.getByText(/You blocked this account/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));
    });
    expect(unblock).toHaveBeenCalledWith('aino');
    expect(screen.getByPlaceholderText('Write a message…')).toBeTruthy();
  });

  it('starts a conversation when Enter is pressed in the username box', async () => {
    const start = vi
      .spyOn(api, 'startConversation')
      .mockResolvedValue({ ok: true, conversationId: 'c1' });
    await renderView(conversation());
    const input = screen.getByPlaceholderText('username');
    fireEvent.change(input, { target: { value: ' aino ' } });
    await act(async () => {
      fireEvent.submit(input.closest('form') as HTMLFormElement);
    });
    expect(start).toHaveBeenCalledWith('aino');
  });

  it('says so when Search finds no account', async () => {
    vi.spyOn(api, 'searchUsers').mockResolvedValue({
      data: [],
      meta: { source: 'api' },
    });
    await renderView(conversation());
    fireEvent.change(screen.getByPlaceholderText('username'), {
      target: { value: 'nobody' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    });
    expect(screen.getByRole('status').textContent).toBe(
      'No account found for "nobody".',
    );
  });
});
