import { apiGet, buildQuery, parsePositiveInt } from '../api-client.mjs';
import { formatDate, formatTable, safeName } from '../format.mjs';

/** Bounds from `NotificationListQuerySchema` in `@tahti/shared`. */
export const MAX_NOTIFICATIONS_LIMIT = 50;

export async function fetchNotifications(config, { limit } = {}) {
  const query = buildQuery({
    limit: parsePositiveInt('--limit', limit, MAX_NOTIFICATIONS_LIMIT),
  });
  return apiGet(`/api/me/notifications${query}`, config);
}

export function formatNotificationRow(notification) {
  const actor = notification.actor
    ? safeName(notification.actor.displayName, notification.actor.username)
    : null;
  return [
    notification.id,
    notification.readAt ? '' : '*',
    formatDate(notification.createdAt),
    notification.type,
    actor,
    notification.title,
  ];
}

export function formatNotificationsTable(notifications) {
  return formatTable(
    ['ID', 'NEW', 'DATE', 'TYPE', 'FROM', 'TITLE'],
    notifications.map(formatNotificationRow),
  );
}

export async function runNotificationsList(
  config,
  { json = false, limit, unread = false } = {},
) {
  const result = await fetchNotifications(config, { limit });
  if (json) {
    return JSON.stringify(result, null, 2);
  }
  const shown = unread
    ? result.notifications.filter((notification) => !notification.readAt)
    : result.notifications;
  const summary = `${result.unreadCount} unread.`;
  if (shown.length === 0) {
    return unread ? 'No unread notifications.' : 'No notifications yet.';
  }
  const more = result.hasMore
    ? ' Older notifications exist; raise --limit.'
    : '';
  return `${formatNotificationsTable(shown)}\n\n${summary}${more}`;
}
