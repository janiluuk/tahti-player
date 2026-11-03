import type { ChatMessage } from '../api/types';

export const CHAT_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

/** `GET /api/chat/:slug/history` returns at most this many messages, so a
 * full page inside the window means "at least this many". */
export const CHAT_HISTORY_LIMIT = 100;

export type ChatActivity = {
  count: number;
  /** The history page was full: there may be more messages than `count`. */
  atLeast: boolean;
  lastTs: number | null;
};

/** Listener messages in the last 24 hours (system lines left out). */
export function chatActivity(
  messages: ChatMessage[],
  now: number = Date.now(),
): ChatActivity {
  const since = now - CHAT_ACTIVITY_WINDOW_MS;
  const recent = messages.filter(
    (message) => !message.system && message.ts >= since,
  );
  return {
    count: recent.length,
    atLeast: messages.length >= CHAT_HISTORY_LIMIT && recent.length > 0,
    lastTs: recent.reduce<number | null>(
      (latest, message) =>
        latest === null || message.ts > latest ? message.ts : latest,
      null,
    ),
  };
}

export function chatActivityLabel(activity: ChatActivity): string {
  if (activity.count === 0) {
    return 'No messages';
  }
  const count = `${activity.count}${activity.atLeast ? '+' : ''}`;
  return `${count} ${activity.count === 1 && !activity.atLeast ? 'message' : 'messages'}`;
}
