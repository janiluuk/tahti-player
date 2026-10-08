import { Link } from '@tanstack/react-router';
import { ExternalLinkIcon, SparklesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button, cn, ImageReveal, ViewShell } from '@tahti-player/ui';

import { fetchAnnouncements } from '../api/client';
import type { Announcement } from '../api/types';
import { PageLoading } from '../components/PageStates';

function TimelineNode({ isLatest }: { isLatest?: boolean }) {
  return isLatest ? (
    <div className="bg-accent-green border-foreground flex size-7 shrink-0 items-center justify-center rounded-full border-(length:--border-width)">
      <SparklesIcon className="text-foreground size-4" strokeWidth={2.5} />
    </div>
  ) : (
    <div className="bg-foreground border-foreground size-5 shrink-0 rounded-full border-(length:--border-width)">
      <div className="bg-background-secondary border-background-secondary size-full rounded-full border-(length:--border-width)">
        <div className="bg-foreground size-full rounded-full" />
      </div>
    </div>
  );
}

function TimelineEntry({
  entry,
  isFirst,
  isLast,
}: {
  entry: Announcement;
  isFirst: boolean;
  isLast: boolean;
}) {
  const safeUrl = (value: string | null | undefined, relative = false) => {
    if (!value) {
      return null;
    }
    if (relative && value.startsWith('/')) {
      return value;
    }
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? value
        : null;
    } catch {
      return null;
    }
  };
  const imageUrl = safeUrl(entry.imageUrl);
  const linkUrl = safeUrl(entry.linkUrl, true);

  return (
    <div data-testid="announcement-entry" className="flex gap-4">
      <div className="flex w-4 flex-col items-center gap-1">
        <div
          className={cn(
            'w-1 flex-1 rounded-b-full',
            isFirst ? 'bg-transparent' : 'bg-border',
          )}
        />
        <TimelineNode isLatest={isFirst} />
        <div
          className={cn(
            'w-1 flex-1 rounded-t-full',
            isLast ? 'bg-transparent' : 'bg-border',
          )}
        />
      </div>
      <div className="my-4 flex flex-1 flex-col gap-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-foreground-secondary text-xs font-medium">
            {entry.authorName}
          </span>
          <span className="text-foreground-secondary text-xs">
            {new Date(entry.publishedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="border-border bg-background-secondary shadow-shadow flex-1 overflow-hidden rounded-md border-(length:--border-width)">
          {imageUrl ? (
            <ImageReveal
              src={imageUrl}
              alt={`${entry.headline} thumbnail`}
              className="aspect-[16/7] w-full"
            />
          ) : null}
          <div className="p-4">
            <p className="text-sm font-semibold">{entry.headline}</p>
            <p className="text-foreground-secondary mt-1 text-sm whitespace-pre-wrap">
              {entry.summary}
            </p>
            {linkUrl ? (
              <a
                href={linkUrl}
                target={linkUrl.startsWith('/') ? undefined : '_blank'}
                rel={linkUrl.startsWith('/') ? undefined : 'noreferrer'}
                className="text-primary mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-2 hover:underline"
              >
                {entry.linkLabel?.trim() || 'Read more'}
                <ExternalLinkIcon size={14} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

const INITIAL_COUNT = 5;

export function NewsView() {
  const [entries, setEntries] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAnnouncements().then((res) => {
      if (cancelled) {
        return;
      }
      setEntries(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleEntries = showAll ? entries : entries.slice(0, INITIAL_COUNT);
  const hiddenCount = entries.length - INITIAL_COUNT;

  return (
    <ViewShell title="Platform news" classes={{ scrollableArea: 'px-4' }}>
      <div className="mx-auto flex w-full max-w-2xl flex-col pr-4 pl-2">
        <p className="text-foreground-secondary mb-4 text-sm">
          News, service updates, and posts from the Tahti team.{' '}
          <Link
            to="/whats-new"
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            See what's new in each release
          </Link>
          .
        </p>

        {loading && <PageLoading label="Loading announcements…" />}

        {!loading && entries.length === 0 && (
          <p className="text-foreground-secondary text-sm">
            No announcements yet.
          </p>
        )}

        {visibleEntries.map((entry, index) => (
          <TimelineEntry
            key={entry.id}
            entry={entry}
            isFirst={index === 0}
            isLast={index === visibleEntries.length - 1}
          />
        ))}

        {!showAll && hiddenCount > 0 && (
          <Button
            type="button"
            variant="text"
            size="sm"
            className="self-start"
            onClick={() => setShowAll(true)}
          >
            Show {hiddenCount} more
          </Button>
        )}
      </div>
    </ViewShell>
  );
}
