import { i18n } from '@tahti-player/i18n';

import type { ChannelSlugRenamed } from '../../../api/channel-design/domain';
import { numericDate } from '../../../lib/relativeDate';

export function channelRenameNote(
  result: Pick<
    ChannelSlugRenamed,
    'slug' | 'rtmpStreamKey' | 'previousSlugRedirectExpiresAt'
  >,
): string {
  const parts = [i18n.t('web:channelRename.renamed', { slug: result.slug })];
  if (result.rtmpStreamKey) {
    parts.push(i18n.t('web:channelRename.streamKeyChanged'));
  }
  if (result.previousSlugRedirectExpiresAt) {
    const until = new Date(result.previousSlugRedirectExpiresAt);
    if (!Number.isNaN(until.getTime())) {
      parts.push(
        i18n.t('web:channelRename.redirectUntil', {
          date: numericDate(until),
        }),
      );
    }
  }
  return parts.join(' ');
}
