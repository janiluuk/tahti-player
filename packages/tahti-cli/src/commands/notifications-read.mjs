import { apiSendNoContent, CliError } from '../api-client.mjs';

/**
 * `--all` uses the inbox's "mark all read", which leaves sticky notices
 * (board announcements that must be acknowledged) unread on purpose; those
 * are cleared one at a time by id.
 */
export async function runNotificationsRead(config, id, { all = false } = {}) {
  if (all && id) {
    throw new CliError('Give a notification id or --all, not both.');
  }
  if (all) {
    await apiSendNoContent('POST', '/api/me/notifications/read-all', config);
    return 'Marked all notifications read (sticky notices stay until read by id).';
  }
  if (!id) {
    throw new CliError(
      'Missing notification id.\nRun `tahti notifications read --help` for usage.',
    );
  }
  await apiSendNoContent(
    'PATCH',
    `/api/me/notifications/${encodeURIComponent(id)}/read`,
    config,
  );
  return `Marked ${id} read.`;
}
