import { apiGet, CliError } from '../api-client.mjs';
import {
  formatDate,
  formatDetails,
  formatTable,
  safeName,
} from '../format.mjs';

function authorName(name) {
  return safeName(name, 'a member');
}

function topicState(topic) {
  const parts = [];
  if (topic.pinned) {
    parts.push('pinned');
  }
  if (topic.status === 'CLOSED') {
    parts.push('closed');
  }
  if (topic.muted) {
    parts.push('muted');
  } else if (topic.following) {
    parts.push('following');
  }
  return parts.join(', ');
}

export function formatDiscussionsTable(topics) {
  return formatTable(
    ['ID', 'TOPIC', 'REPLIES', 'NEW', 'LAST ACTIVITY', 'STATE'],
    topics.map((topic) => [
      topic.id,
      topic.title,
      String(topic.postCount),
      topic.unreadCount ? String(topic.unreadCount) : '',
      formatDate(topic.lastPostAt),
      topicState(topic),
    ]),
  );
}

export async function runDiscussionsList(config, { json = false } = {}) {
  const result = await apiGet('/api/v1/governance/discussions', config);
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  if (result.topics.length === 0) {
    return 'The board has not opened any discussions yet.';
  }
  return formatDiscussionsTable(result.topics);
}

export async function runDiscussionsShow(config, id, { json = false } = {}) {
  if (!id?.trim()) {
    throw new CliError(
      'Give a topic id.\nRun `tahti discussions list` to find one.',
    );
  }
  const topic = await apiGet(
    `/api/v1/governance/discussions/${encodeURIComponent(id.trim())}`,
    config,
  );
  if (json) {
    return JSON.stringify(topic, null, 2);
  }
  const header = formatDetails([
    ['Topic', topic.title],
    ['Opened by', authorName(topic.createdBy)],
    ['Opened', formatDate(topic.createdAt)],
    ['State', topicState(topic) || 'open'],
  ]);
  const replies =
    topic.posts.length === 0
      ? 'No replies yet.'
      : topic.posts
          .map(
            (post) =>
              `${authorName(post.author)}, ${formatDate(post.createdAt)} (#${post.id})\n${post.body}`,
          )
          .join('\n\n');
  return `${header}\n\n${topic.body}\n\n--- ${topic.posts.length} ${
    topic.posts.length === 1 ? 'reply' : 'replies'
  } ---\n\n${replies}`;
}
