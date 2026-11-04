import type { PublicRadioShowEpisode } from '../api/shows';
import { cn } from '../lib/cn';
import { formatScheduleWindow } from '../lib/scheduleTime';
import { ListingDate } from './ListingDate';

/** When a show episode airs: the exact window while it is ahead or on air,
 * a `ListingDate` once it has aired. */
export function ShowEpisodeWhen({
  episode,
  className,
}: {
  episode: Pick<PublicRadioShowEpisode, 'startAt' | 'endAt'>;
  className?: string;
}) {
  if (new Date(episode.endAt).getTime() < Date.now()) {
    return <ListingDate value={episode.startAt} className={className} />;
  }
  return (
    <span className={cn('block', className)}>
      {formatScheduleWindow(episode.startAt, episode.endAt)}
    </span>
  );
}
