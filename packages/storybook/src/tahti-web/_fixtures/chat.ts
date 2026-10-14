import type { ChatMessage, TrackComment } from '@tahti-web/api/types';

const BASE_TS = Date.UTC(2026, 8, 27, 20, 0, 0);
const at = (minutes: number) => BASE_TS + minutes * 60_000;

/** A busy live chat: owner, moderator, a supporter, plain listeners, a system line. */
export const CHAT_HISTORY: ChatMessage[] = [
  {
    id: 'chat-1',
    handle: 'northern-lights',
    text: 'Welcome in! Two hours of slow techno tonight.',
    ts: at(0),
    channelRole: 'owner',
    countryCode: 'FI',
  },
  {
    id: 'chat-2',
    handle: 'aurora-fan',
    text: 'Made it just in time',
    ts: at(1),
    supporter: true,
    countryCode: 'SE',
  },
  {
    id: 'chat-3',
    handle: 'kaamos-mod',
    text: 'Be nice, keep it about the music.',
    ts: at(2),
    channelRole: 'moderator',
    countryCode: 'FI',
  },
  {
    id: 'chat-4',
    handle: 'lumi',
    text: 'That bassline at the 20 minute mark though',
    ts: at(4),
    countryCode: 'NO',
  },
  {
    id: 'chat-5',
    handle: 'nightbus',
    text: 'ID on this one?',
    ts: at(6),
    countryCode: 'DE',
  },
  {
    id: 'chat-6',
    handle: 'northern-lights',
    text: 'Unreleased - out on the next EP.',
    ts: at(7),
    channelRole: 'owner',
    countryCode: 'FI',
  },
];

export const FAN_ROOM_HISTORY = [
  {
    handle: 'northern-lights',
    text: 'Fans first: the EP drops Friday.',
    ts: at(10),
  },
  { handle: 'aurora-fan', text: 'Pre-saved already!', ts: at(11) },
  { handle: 'lumi', text: 'Any chance of a vinyl run?', ts: at(12) },
];

export const CHANNEL_COMMENTS: TrackComment[] = [
  {
    id: 'channel-comment-1',
    body: 'Best Sunday stream around.',
    authorUsername: 'lumi',
    authorDisplayName: 'Lumi',
    authorAvatarUrl: null,
    createdAt: '2026-09-20T18:00:00.000Z',
  },
  {
    id: 'channel-comment-2',
    body: 'The ambient hour last week was something else.',
    authorUsername: 'listener-liina',
    authorDisplayName: 'Liina',
    authorAvatarUrl: null,
    createdAt: '2026-09-24T21:30:00.000Z',
  },
  {
    id: 'channel-comment-3',
    body: 'Thanks for all the support - see you Friday!',
    authorUsername: 'northern-lights',
    authorDisplayName: 'Northern Lights',
    authorAvatarUrl: null,
    createdAt: '2026-09-26T09:15:00.000Z',
  },
];
