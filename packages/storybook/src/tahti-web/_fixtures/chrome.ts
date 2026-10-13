import type { ConversationSummary } from '@tahti-web/api/messages';
import type { TahtiNotification } from '@tahti-web/api/notifications';

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

/** One DM per staff role (artist / moderator) plus a plain listener. */
export const CHROME_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv-artist',
    otherUser: {
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      avatarUrl: null,
      channelRole: 'owner',
      available: true,
    },
    lastMessage: {
      body: 'Want to do a b2b on Friday?',
      senderUsername: 'midnight-cartography',
      createdAt: minutesAgo(4),
    },
    unreadCount: 2,
    updatedAt: minutesAgo(4),
  },
  {
    id: 'conv-moderator',
    otherUser: {
      username: 'kaamos-mod',
      displayName: 'Kaamos Crew',
      avatarUrl: null,
      channelRole: 'moderator',
      available: true,
    },
    lastMessage: {
      body: 'Chat was calm tonight, nothing to flag.',
      senderUsername: 'kaamos-mod',
      createdAt: minutesAgo(90),
    },
    unreadCount: 0,
    updatedAt: minutesAgo(90),
  },
  {
    id: 'conv-listener',
    otherUser: {
      username: 'listener-liina',
      displayName: 'Liina',
      avatarUrl: null,
      channelRole: null,
      available: true,
    },
    lastMessage: {
      body: 'Loved the set last night!',
      senderUsername: 'listener-liina',
      createdAt: minutesAgo(600),
    },
    unreadCount: 0,
    updatedAt: minutesAgo(600),
  },
];

export const CHROME_NOTIFICATIONS: TahtiNotification[] = [
  {
    id: 'chrome-notification-sticky',
    type: 'GOVERNANCE',
    actor: null,
    title: 'Board vote closes tonight',
    body: 'Read the proposal and cast your vote before 23:59.',
    url: null,
    readAt: null,
    sticky: true,
    createdAt: minutesAgo(10),
  },
  {
    id: 'chrome-notification-fan',
    type: 'FAN',
    actor: {
      username: 'midnight-cartography',
      displayName: 'Midnight Cartography',
      avatarUrl: null,
    },
    title: 'New fan',
    body: 'Midnight Cartography started following your channel.',
    url: '/u/midnight-cartography',
    readAt: null,
    sticky: false,
    createdAt: minutesAgo(15),
  },
  {
    id: 'chrome-notification-read',
    type: 'EVENT',
    actor: null,
    title: 'Your event is coming up',
    body: 'Album release show starts tomorrow at 18:00.',
    url: '/studio/events',
    readAt: minutesAgo(30),
    sticky: false,
    createdAt: minutesAgo(120),
  },
];
