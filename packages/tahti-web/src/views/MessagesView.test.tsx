// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
    data: { id: summary.id, otherUser: summary.otherUser, messages },
    meta: { source: 'api' },
  });
  const router = createRouter({
    routeTree: createRootRoute({
      component: () => <MessagesView threadId="c1" />,
    }),
    history: createMemoryHistory({ initialEntries: ['/messages/c1'] }),
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
