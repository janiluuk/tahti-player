import { ButtonLink } from '@tahti-player/ui';

import { type RecentBroadcast } from '../../../api/broadcast';
import { formatBroadcastDate, formatBroadcastDuration } from './home-helpers';

export function RecentBroadcastRow({
  broadcast,
}: {
  broadcast: RecentBroadcast;
}) {
  const title =
    broadcast.title ||
    broadcast.soundTitle ||
    `Broadcast ${formatBroadcastDate(broadcast.startedAt)}`;
  const published = broadcast.soundStatus === 'READY';

  return (
    <li className="border-border flex flex-wrap items-center gap-3 border-b px-4 py-3 last:border-b-0">
      <span className="bg-accent-red/15 text-accent-red flex size-9 shrink-0 items-center justify-center rounded-lg text-sm">
        ●
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{title}</p>
        <p className="text-foreground-secondary truncate text-xs">
          {formatBroadcastDate(broadcast.startedAt)}
          {broadcast.durationSec
            ? ` · ${formatBroadcastDuration(broadcast.durationSec)}`
            : ''}
          {broadcast.source
            ? ` · ${broadcast.source.toLowerCase().replace('_', ' ')}`
            : ''}
        </p>
      </div>
      <span
        className={`text-xs font-medium ${
          published ? 'text-accent-green' : 'text-foreground-secondary'
        }`}
      >
        {published ? 'Published' : 'Recorded'}
      </span>
      <ButtonLink
        to={broadcast.soundId ? '/studio/sounds/$id' : '/library/recordings'}
        params={broadcast.soundId ? { id: broadcast.soundId } : undefined}
        size="sm"
        variant="secondary"
      >
        {broadcast.soundId ? 'Open' : 'Publish'}
      </ButtonLink>
    </li>
  );
}
