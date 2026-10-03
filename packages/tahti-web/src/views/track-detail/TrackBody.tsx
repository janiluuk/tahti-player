import { Link } from '@tanstack/react-router';

import { Button, MediaArtwork } from '@tahti-player/ui';

import { CommentItem } from '../../components/CommentItem';
import { cn } from '../../lib/cn';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { parseTimedComment } from '../../lib/timedComment';
import { type TrackPage } from './buildTrackPage';
import { cueLabel } from './helpers';
import { TrackDetailsBlock } from './TrackDetailsBlock';

export function TrackBody({ page }: { page: TrackPage }) {
  const {
    detail,
    comments,
    playable,
    tracklist,
    activeCueId,
    relatedTracks,
    relatedCollections,
    jumpTo,
    canDeleteComment,
    removeComment,
    deletingCommentId,
  } = page;

  return (
    <section className="bg-background px-6 py-8 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {detail?.description ? (
            <div className="mb-6 text-sm leading-relaxed whitespace-pre-wrap">
              {detail.description}
            </div>
          ) : null}
          {tracklist.length > 0 ? (
            <ol className="flex flex-col gap-1.5 text-sm">
              {tracklist.map((cue) => (
                <li key={cue.id} className="flex flex-wrap items-baseline">
                  <Button
                    variant="text"
                    onClick={() => {
                      if (cue.startSec != null) {
                        jumpTo(cue.startSec);
                      }
                    }}
                    className={cn(
                      'hover:text-primary h-auto rounded-none p-0 text-left whitespace-normal hover:bg-transparent active:scale-100 active:bg-transparent',
                      cue.id === activeCueId && 'text-primary font-medium',
                    )}
                  >
                    {cue.startSec != null ? (
                      <span className="text-foreground-secondary mr-2 tabular-nums">
                        {formatDuration(cue.startSec)}
                      </span>
                    ) : null}
                    {cue.artist && cue.artistUsername
                      ? cue.title
                      : cueLabel(cue.artist, cue.title)}
                  </Button>
                  {cue.artist && cue.artistUsername ? (
                    <>
                      <span className="mx-1">–</span>
                      <Link
                        to="/u/$username"
                        params={{ username: cue.artistUsername }}
                        className="text-primary hover:underline"
                      >
                        {cue.artist}
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}

          <TrackDetailsBlock
            detail={detail}
            className={tracklist.length > 0 ? 'mt-10' : undefined}
          />

          <div className="mt-10">
            <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
              Comments
            </h2>
            {comments.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No comments yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {comments.map((comment) => {
                  const parsed = parseTimedComment(comment.body);
                  const cueSeconds = parsed.seconds;
                  return (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      text={parsed.text}
                      meta={
                        parsed.timestamp && cueSeconds != null ? (
                          <Button
                            variant="text"
                            size="sm"
                            className="text-primary tabular-nums"
                            onClick={() => jumpTo(cueSeconds)}
                          >
                            {parsed.timestamp}
                          </Button>
                        ) : null
                      }
                      onDelete={
                        canDeleteComment(comment)
                          ? () => void removeComment(comment.id)
                          : undefined
                      }
                      deleting={deletingCommentId === comment.id}
                    />
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {relatedCollections.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Collections
              </h2>
              <ul className="flex flex-col gap-3">
                {relatedCollections.map((collection) => (
                  <li key={collection.slug}>
                    <Link
                      to="/u/$username/c/$slug"
                      params={{
                        username: detail?.channel.username ?? '',
                        slug: collection.slug,
                      }}
                      className="hover:bg-background-secondary flex items-center gap-3 rounded-lg p-1"
                    >
                      <MediaArtwork
                        src={
                          collection.coverUrl ??
                          placeholderArtworkUrl(collection.slug)
                        }
                        alt=""
                        size="md"
                        className="size-14 min-w-14 shrink-0 rounded"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {collection.name}
                        </span>
                        <span className="text-foreground-secondary block text-xs">
                          {collection.itemCount}{' '}
                          {collection.itemCount === 1 ? 'track' : 'tracks'}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {relatedTracks.length > 0 ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                More from {playable.artist}
              </h2>
              <ul className="flex flex-col gap-3">
                {relatedTracks.map((track) => (
                  <li key={track.id}>
                    <Link
                      to="/t/$id"
                      params={{ id: track.id }}
                      className="hover:bg-background-secondary flex items-center gap-3 rounded-lg p-1"
                    >
                      <MediaArtwork
                        src={track.bannerUrl ?? placeholderArtworkUrl(track.id)}
                        alt=""
                        size="md"
                        className="size-14 min-w-14 shrink-0 rounded"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {track.title}
                        </span>
                        {track.durationSec ? (
                          <span className="text-foreground-secondary text-xs tabular-nums">
                            {formatDuration(track.durationSec)}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
