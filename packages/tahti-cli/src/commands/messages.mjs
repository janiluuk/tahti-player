import { apiGet, apiPost, CliError } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

const PREVIEW_LENGTH = 60;

function preview(text) {
  const line = text.replace(/\s+/g, ' ').trim();
  return line.length > PREVIEW_LENGTH
    ? `${line.slice(0, PREVIEW_LENGTH - 1)}…`
    : line;
}

export function formatConversationsTable(conversations) {
  return formatTable(
    ['WITH', 'NAME', 'UNREAD', 'UPDATED', 'LAST MESSAGE'],
    conversations.map((conversation) => {
      const other = conversation.otherUser;
      const last = conversation.lastMessage;
      return [
        other.available === false
          ? `${other.username} (unavailable)`
          : other.username,
        safeName(other.displayName, other.username),
        conversation.unreadCount || '',
        formatDate(conversation.updatedAt),
        last ? `${last.senderUsername}: ${preview(last.body)}` : null,
      ];
    }),
  );
}

export async function runMessagesList(config, { json = false } = {}) {
  const conversations = await apiGet('/api/me/messages/conversations', config);
  if (json) {
    return JSON.stringify(conversations, null, 2);
  }
  if (conversations.length === 0) {
    return 'No conversations yet.';
  }
  const unread = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount ?? 0),
    0,
  );
  return `${formatConversationsTable(conversations)}\n\n${unread} unread.`;
}

export async function runMessagesSend(config, username, words) {
  const handle = username?.trim().replace(/^@/, '');
  const body = words.join(' ').trim();
  if (!handle || !body) {
    throw new CliError(
      'Give a username and a message.\nRun `tahti messages send --help` for usage.',
    );
  }
  const { conversationId } = await apiPost(
    '/api/me/messages/conversations',
    { username: handle },
    config,
  );
  await apiPost(
    `/api/me/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
    { body },
    config,
  );
  return `Sent to @${handle}.`;
}
