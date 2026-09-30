import { Trash2Icon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, MediaArtwork } from '@tahti-player/ui';

import type { TrackComment } from '../api/types';
import { placeholderArtworkUrl } from '../lib/placeholderArt';

/** One track or channel comment: avatar, name, date, text, and a delete
 * button when the viewer may remove it. */
export function CommentItem({
  comment,
  text,
  meta,
  onDelete,
  deleting,
}: {
  comment: TrackComment;
  /** Body to show when the caller has stripped markup (e.g. a timestamp). */
  text?: string;
  /** Extra inline bits after the author, e.g. a jump-to-time button. */
  meta?: ReactNode;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <MediaArtwork
        src={
          comment.authorAvatarUrl ??
          placeholderArtworkUrl(comment.authorUsername)
        }
        alt=""
        size="sm"
        className="rounded-full"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold">
            {comment.authorDisplayName}
          </span>
          {meta}
          <time
            className="text-foreground-secondary text-xs"
            dateTime={comment.createdAt}
          >
            {new Date(comment.createdAt).toLocaleDateString()}
          </time>
        </div>
        <p className="mt-1 text-sm">{text ?? comment.body}</p>
      </div>
      {onDelete ? (
        <Button
          variant="text"
          size="sm"
          aria-label={`Delete comment by ${comment.authorDisplayName}`}
          disabled={deleting}
          onClick={onDelete}
        >
          <Trash2Icon size={14} aria-hidden />
        </Button>
      ) : null}
    </li>
  );
}
