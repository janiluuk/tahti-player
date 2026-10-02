import type { ChannelSlugRenamed } from '../../../api/channel-design/domain';

export function channelRenameNote(
  result: Pick<
    ChannelSlugRenamed,
    'slug' | 'rtmpStreamKey' | 'previousSlugRedirectExpiresAt'
  >,
  locale?: string,
): string {
  const parts = [`Renamed to ${result.slug}.`];
  if (result.rtmpStreamKey) {
    parts.push(
      'Your stream key changed - copy the new key from Go live into OBS or your encoder before your next stream.',
    );
  }
  if (result.previousSlugRedirectExpiresAt) {
    const until = new Date(result.previousSlugRedirectExpiresAt);
    if (!Number.isNaN(until.getTime())) {
      parts.push(
        `Your old address redirects here until ${until.toLocaleDateString(
          locale,
          { day: 'numeric', month: 'long', year: 'numeric' },
        )}.`,
      );
    }
  }
  return parts.join(' ');
}
