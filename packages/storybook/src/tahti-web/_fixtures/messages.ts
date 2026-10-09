import type {
  ChatDm,
  ConversationDetail,
  ConversationSummary,
} from '@tahti-web/api/messages';
import type { AuthUser } from '@tahti-web/api/types';

import type { MockOverrides } from '../_lib/mock-data';
import { isoFromNow } from './channel';

const HOUR = 3_600_000;

/** The account the mock DM API sends as (`sendDm` signs messages "Demo
 * Artist"), so sent messages and the signed-in user agree. */
export const DM_USER: AuthUser = {
  id: 'mock-user-1',
  email: 'demo@tahti.live',
  username: 'demo',
  displayName: 'Demo Artist',
  role: 'ARTIST',
  isMember: true,
};

/** The mock API's own seeded thread, so sending and contacts keep working. */
export const LISTENER_THREAD = 'conv-mock-1';
export const ARTIST_THREAD = 'conv-story-artist';
export const GONE_THREAD = 'conv-story-gone';

const ARTIST: ConversationSummary['otherUser'] = {
  username: 'northern-lights',
  displayName: 'Northern Lights',
  avatarUrl: null,
  channelRole: 'owner',
};

const GONE: ConversationSummary['otherUser'] = {
  username: 'removed-account',
  displayName: 'Former listener',
  avatarUrl: null,
  available: false,
};

const ARTIST_MESSAGES: ChatDm[] = [
  {
    id: 'a1',
    senderUsername: 'demo',
    senderDisplayName: 'Demo Artist',
    senderAvatarUrl: null,
    body: 'Could I play your Polar Static edit on my Friday show?',
    createdAt: isoFromNow(-3 * HOUR),
    isMine: true,
  },
  {
    id: 'a2',
    senderUsername: 'northern-lights',
    senderDisplayName: 'Northern Lights',
    senderAvatarUrl: null,
    body: 'Of course - tag the channel when it airs.',
    createdAt: isoFromNow(-2 * HOUR),
    isMine: false,
    senderChannelRole: 'owner',
  },
];

const EXTRA_THREADS: Record<string, ConversationDetail> = {
  [ARTIST_THREAD]: {
    id: ARTIST_THREAD,
    otherUser: ARTIST,
    messages: ARTIST_MESSAGES,
    hasMore: true,
  },
  [GONE_THREAD]: {
    id: GONE_THREAD,
    otherUser: GONE,
    messages: [
      {
        id: 'g1',
        senderUsername: 'removed-account',
        senderDisplayName: 'Former listener',
        senderAvatarUrl: null,
        body: 'See you at the next show!',
        createdAt: isoFromNow(-48 * HOUR),
        isMine: false,
      },
    ],
  },
};

export const inboxData: MockOverrides = {
  conversations: (base) => [
    {
      id: ARTIST_THREAD,
      otherUser: ARTIST,
      lastMessage: {
        body: 'Of course - tag the channel when it airs.',
        senderUsername: 'northern-lights',
        createdAt: isoFromNow(-2 * HOUR),
      },
      unreadCount: 1,
      updatedAt: isoFromNow(-2 * HOUR),
    },
    ...base,
    {
      id: GONE_THREAD,
      otherUser: GONE,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: isoFromNow(-48 * HOUR),
    },
  ],
  conversation: (base, id) => base ?? EXTRA_THREADS[id] ?? null,
  messageContacts: (base) => [
    ...base,
    {
      username: 'northern-lights',
      displayName: 'Northern Lights',
      avatarUrl: null,
      followsYou: false,
      followedByYou: true,
    },
  ],
};
