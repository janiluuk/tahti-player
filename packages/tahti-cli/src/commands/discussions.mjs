import { apiGet, apiPost, apiSendJson, CliError } from '../api-client.mjs';
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
    ['ID', 'TOPIC', 'REPLIES', 'NEW', 'LAST ACTIVITY', 'LAST REPLY', 'STATE'],
    topics.map((topic) => [
      topic.id,
      topic.title,
      String(topic.postCount),
      topic.unreadCount ? String(topic.unreadCount) : '',
      formatDate(topic.lastPostAt),
      topic.lastReplyBy ? authorName(topic.lastReplyBy) : '',
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

function formatReplies(posts) {
  return posts
    .map(
      (post) =>
        `${authorName(post.author)}, ${formatDate(post.createdAt)}${post.editedAt ? ' (edited)' : ''} (#${post.id})\n${post.body}`,
    )
    .join('\n\n');
}

function earlierHint(id, posts) {
  return `Earlier replies: tahti discussions show ${id} --before ${posts[0].id}`;
}

export async function runDiscussionsShow(
  config,
  id,
  { json = false, before } = {},
) {
  if (!id?.trim()) {
    throw new CliError(
      'Give a topic id.\nRun `tahti discussions list` to find one.',
    );
  }
  const topicId = id.trim();
  if (before) {
    const cursor = String(before).trim().replace(/^#/, '');
    if (!/^\d+$/.test(cursor)) {
      throw new CliError('--before takes a reply number, such as 123.');
    }
    const page = await apiGet(
      `/api/v1/governance/discussions/${encodeURIComponent(topicId)}/posts?before=${cursor}`,
      config,
    );
    if (json) {
      return JSON.stringify(page, null, 2);
    }
    if (page.posts.length === 0) {
      return 'No earlier replies.';
    }
    const more = page.hasEarlierPosts
      ? `\n\n${earlierHint(topicId, page.posts)}`
      : '';
    return `${formatReplies(page.posts)}${more}`;
  }
  const topic = await apiGet(
    `/api/v1/governance/discussions/${encodeURIComponent(topicId)}`,
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
    topic.posts.length === 0 ? 'No replies yet.' : formatReplies(topic.posts);
  const total = Math.max(topic.postCount ?? 0, topic.posts.length);
  const more = topic.hasEarlierPosts
    ? `\n\n${earlierHint(topicId, topic.posts)}`
    : '';
  return `${header}\n\n${topic.body}\n\n--- ${total} ${
    total === 1 ? 'reply' : 'replies'
  } ---\n\n${replies}${more}`;
}

function topicPath(id) {
  if (!id?.trim()) {
    throw new CliError(
      'Give a topic id.\nRun `tahti discussions list` to find one.',
    );
  }
  return `/api/v1/governance/discussions/${encodeURIComponent(id.trim())}`;
}

export async function runDiscussionsReply(config, id, words) {
  const path = topicPath(id);
  const body = words.join(' ').trim();
  if (!body) {
    throw new CliError(
      'Give the reply text after the topic id.\nRun `tahti discussions reply --help` for usage.',
    );
  }
  const post = await apiPost(`${path}/posts`, { body }, config);
  return `Replied (#${post.id}). You follow this topic now.`;
}

export async function runDiscussionsFollow(config, id, following) {
  const result = await apiSendJson(
    'PUT',
    `${topicPath(id)}/follow`,
    { following },
    config,
  );
  return result.following
    ? 'Following: new replies notify you.'
    : 'No longer following this topic.';
}

export async function runDiscussionsEdit(config, id, postId, words) {
  const path = topicPath(id);
  const body = words.join(' ').trim();
  if (!postId?.trim() || !body) {
    throw new CliError(
      'Give the topic id, the reply number and the new text.\nRun `tahti discussions edit --help` for usage.',
    );
  }
  await apiSendJson(
    'PATCH',
    `${path}/posts/${encodeURIComponent(postId.trim().replace(/^#/, ''))}`,
    { body },
    config,
  );
  return 'Reply updated.';
}

export async function runDiscussionsMute(config, id, muted) {
  await apiSendJson('PUT', `${topicPath(id)}/mute`, { muted }, config);
  return muted
    ? 'Muted: you still follow it, without notifications.'
    : 'Unmuted: new replies notify you again.';
}

export async function runDiscussionsReadAll(config) {
  const { marked } = await apiPost(
    '/api/v1/governance/discussions/read-all',
    {},
    config,
  );
  return marked === 1
    ? 'Marked 1 topic read.'
    : `Marked ${marked} topics read.`;
}
