import { Link } from '@tanstack/react-router';
import { CheckIcon, PencilIcon, RadioIcon } from 'lucide-react';

import { Button, Loader, Tooltip } from '@tahti-player/ui';

import type { RecentBroadcast } from '../../../api/broadcast';
import { formatDate, formatDuration, isPublished } from './helpers';

/** Library row treatment — thumbnail
 * box, title, subtitle, status badge, and an edit action — reused here
 * rather than a new listing widget. Recordings carry no artwork/waveform
 * data, so the thumbnail is always the placeholder icon. */
export function RecordingRow({
  show,
  index,
  onEdit,
}: {
  show: RecentBroadcast;
  index: number;
  onEdit: (soundId: string) => void;
}) {
  const title =
    show.title || show.soundTitle || `Show ${formatDate(show.startedAt)}`;
  const published = isPublished(show);
  const processing = !show.soundId;

  return (
    <li
      className={`flex flex-wrap items-center gap-3 border-l-4 p-3 transition-colors ${
        published
          ? `border-l-transparent ${index % 2 === 0 ? 'bg-background-secondary/55' : 'bg-background'}`
          : 'border-l-primary bg-primary/10'
      }`}
    >
      <div className="border-border bg-background-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
        <RadioIcon
          size={18}
          aria-hidden
          className="text-foreground-secondary"
        />
      </div>
      <div className="min-w-0 flex-1 basis-28">
        {show.soundId ? (
          <Link
            to="/studio/sounds/$id"
            params={{ id: show.soundId }}
            className="block truncate font-semibold hover:underline"
          >
            {title}
          </Link>
        ) : (
          <span className="block truncate font-semibold">{title}</span>
        )}
        <p className="text-foreground-secondary text-xs break-words">
          {formatDate(show.startedAt)}
          {show.durationSec ? ` · ${formatDuration(show.durationSec)}` : ''}
          {show.source
            ? ` · ${show.source.toLowerCase().replace('_', ' ')}`
            : ''}
        </p>
        <span
          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase ${
            published ? 'text-accent-green-strong' : 'text-foreground'
          }`}
        >
          {published && <CheckIcon size={11} aria-hidden />}
          {processing && <Loader size="xs" shape="circle" />}
          {published ? 'Published' : processing ? 'Processing' : 'Draft'}
        </span>
        {processing ? (
          <p className="text-foreground-secondary mt-0.5 text-xs">
            Still being saved to your library. It shows up in Sounds, ready to
            edit and publish, when it's done.
          </p>
        ) : null}
      </div>
      {show.soundId ? (
        <Tooltip content="Edit track" side="top">
          <Button
            size="icon-sm"
            variant="text"
            aria-label={`Edit ${title}`}
            onClick={() => onEdit(show.soundId!)}
          >
            <PencilIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      ) : null}
    </li>
  );
}
