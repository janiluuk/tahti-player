import { Link } from '@tanstack/react-router';

import { cn } from '../../lib/cn';
import { placeholderArtworkUrl } from '../../lib/placeholderArt';
import { formatDuration } from '../../lib/playableToTrack';
import { parseTimedComment } from '../../lib/timedComment';
import { type TrackPage } from './buildTrackPage';
import { cueLabel } from './helpers';

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
                  <button
                    type="button"
                    onClick={() => {
                      if (cue.startSec != null) {
                        jumpTo(cue.startSec);
                      }
                    }}
                    className={cn(
                      'hover:text-primary text-left',
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
                  </button>
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
                    <li key={comment.id} className="flex gap-3">
                      <img
                        src={
                          comment.authorAvatarUrl ??
                          placeholderArtworkUrl(comment.authorUsername)
                        }
                        alt=""
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            {comment.authorDisplayName}
                          </span>
                          {parsed.timestamp && cueSeconds != null ? (
                            <button
                              type="button"
                              className="text-primary text-xs tabular-nums"
                              onClick={() => jumpTo(cueSeconds)}
                            >
                              {parsed.timestamp}
                            </button>
                          ) : null}
                          <time
                            className="text-foreground-secondary text-xs"
                            dateTime={comment.createdAt}
                          >
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="mt-1 text-sm">{parsed.text}</p>
                      </div>
                    </li>
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
                      <img
                        src={
                          collection.coverUrl ??
                          placeholderArtworkUrl(collection.slug)
                        }
                        alt=""
                        className="size-14 shrink-0 rounded object-cover"
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
                      <img
                        src={track.bannerUrl ?? placeholderArtworkUrl(track.id)}
                        alt=""
                        className="size-14 shrink-0 rounded object-cover"
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
