import { Link } from '@tanstack/react-router';
import { CalendarDaysIcon, ExternalLinkIcon, SparklesIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonAnchor,
  ImageReveal,
  ViewShell,
} from '@tahti-player/ui';

import { fetchAnnouncements } from '../api/client';
import type { Announcement } from '../api/types';
import { HistoryBackButton } from '../components/HistoryBackButton';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { PlatformNewsDialog } from '../components/PlatformNewsDialog';
import { humanizePastDate } from '../lib/humanizeDate';

function NewsEntry({
  entry,
  isLatest,
  onOpen,
}: {
  entry: Announcement;
  isLatest: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation('web');
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
  const imageUrl = safeUrl(entry.imageUrl, true) || '/news-opening.svg';
  const linkUrl = safeUrl(entry.linkUrl, true);

  return (
    <article data-testid="announcement-entry" className="flex flex-col gap-1.5">
      <div className="text-foreground-secondary flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-2">
          {isLatest ? (
            <Badge
              variant="pill"
              color="yellow"
              className="gap-1"
              data-testid="news-latest"
            >
              <SparklesIcon size={12} aria-hidden />
              {t('newsView.latest')}
            </Badge>
          ) : null}
          <span className="truncate font-medium">{entry.authorName}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <CalendarDaysIcon size={14} aria-hidden />
          <time
            dateTime={entry.publishedAt}
            title={new Date(entry.publishedAt).toLocaleString()}
          >
            {humanizePastDate(entry.publishedAt)}
          </time>
        </span>
      </div>
      <div className="border-border bg-background-secondary shadow-shadow overflow-hidden rounded-md border-(length:--border-width)">
        {imageUrl ? (
          <ImageReveal
            src={imageUrl}
            alt={`${entry.headline} thumbnail`}
            className="aspect-[16/7] w-full"
          />
        ) : null}
        <div className="p-3 sm:p-4">
          <Button
            type="button"
            variant="text"
            size="flexible"
            className="h-auto justify-start px-0 text-left text-lg font-semibold whitespace-normal hover:underline"
            onClick={onOpen}
          >
            {entry.headline}
          </Button>
          <p className="text-foreground-secondary mt-1 text-sm whitespace-pre-wrap">
            {entry.summary}
          </p>
          {linkUrl ? (
            <ButtonAnchor
              href={linkUrl}
              variant="text"
              size="flexible"
              target={linkUrl.startsWith('/') ? undefined : '_blank'}
              rel={linkUrl.startsWith('/') ? undefined : 'noreferrer'}
              className="text-primary-strong mt-3 h-auto justify-start gap-1.5 px-0 text-sm font-semibold underline-offset-2 hover:underline"
            >
              {entry.linkLabel?.trim() || t('newsView.readMore')}
              <ExternalLinkIcon size={14} aria-hidden />
            </ButtonAnchor>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const INITIAL_COUNT = 5;

export function NewsView() {
  const { t } = useTranslation('web');
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [entries, setEntries] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchAnnouncements().then((res) => {
      if (cancelled) {
        return;
      }
      setEntries(res.data);
      setLoadError(
        res.meta.source === 'api' ? (res.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const visibleEntries = showAll ? entries : entries.slice(0, INITIAL_COUNT);
  const hiddenCount = entries.length - INITIAL_COUNT;

  return (
    <ViewShell
      title={t('newsView.platformNews')}
      corner={<HistoryBackButton />}
    >
      {selected ? (
        <PlatformNewsDialog
          key={selected.id}
          post={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setEntries((current) =>
              current.map((post) => (post.id === updated.id ? updated : post)),
            );
          }}
        />
      ) : null}
      <div
        className="flex w-full max-w-2xl flex-col gap-6"
        data-testid="news-column"
      >
        <p className="text-foreground-secondary text-sm">
          {t('newsView.intro')}{' '}
          <Link
            to="/whats-new"
            className="text-primary-strong font-medium underline-offset-2 hover:underline"
          >
            {t('newsView.seeWhatSNewIn')}
          </Link>
          .
        </p>

        {loading && <PageLoading label={t('loading.loadingAnnouncements')} />}

        {!loading && loadError && entries.length === 0 && (
          <PageError
            title={t('loadErrors.couldNotLoadTheNews')}
            description={loadError}
            onRetry={() => setAttempt((n) => n + 1)}
          />
        )}

        {!loading && loadError && entries.length > 0 && (
          <p
            className="border-border bg-background-secondary rounded-md border px-3 py-2 text-xs"
            role="status"
          >
            {t('newsView.couldNotRefresh', { reason: loadError })}{' '}
            <Button
              variant="plain"
              size="flexible"
              className="inline p-0 text-xs underline underline-offset-2"
              onClick={() => setAttempt((n) => n + 1)}
            >
              {t('newsView.retry')}
            </Button>
          </p>
        )}

        {!loading && !loadError && entries.length === 0 && (
          <PageEmpty title={t('empties.noAnnouncements')} />
        )}

        {visibleEntries.map((entry, index) => (
          <NewsEntry
            key={entry.id}
            entry={entry}
            onOpen={() => setSelected(entry)}
            isLatest={index === 0}
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
            {t('newsView.showMore', { count: hiddenCount })}
          </Button>
        )}
      </div>
    </ViewShell>
  );
}
