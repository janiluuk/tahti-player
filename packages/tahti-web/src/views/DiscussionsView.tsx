import { Link } from '@tanstack/react-router';
import { BellOffIcon, PinIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Button, FilterChips, ViewShell } from '@tahti-player/ui';

import {
  fetchDiscussionTopics,
  type DiscussionTopic,
} from '../api/governance-discussions';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { useAuthModalStore } from '../stores/authModalStore';
import { useAuthStore } from '../stores/authStore';

type TopicFilter = 'all' | 'open' | 'following' | 'closed';

const FILTERS: Array<{ id: TopicFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'following', label: 'Following' },
  { id: 'closed', label: 'Closed' },
];

function matchesFilter(topic: DiscussionTopic, filter: TopicFilter): boolean {
  switch (filter) {
    case 'open':
      return topic.status === 'OPEN';
    case 'closed':
      return topic.status === 'CLOSED';
    case 'following':
      return topic.following;
    default:
      return true;
  }
}

function lastActivity(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TopicRow({ topic }: { topic: DiscussionTopic }) {
  return (
    <li className="border-border bg-background-secondary rounded-md border-(length:--border-width) p-3">
      <Link
        to="/governance/discussions/$id"
        params={{ id: topic.id }}
        className="flex flex-col gap-1"
      >
        <span className="flex flex-wrap items-center gap-2">
          {topic.pinned ? (
            <PinIcon size={14} aria-label="Pinned" className="shrink-0" />
          ) : null}
          <span className="font-semibold hover:underline">{topic.title}</span>
          {topic.unreadCount ? (
            <Badge variant="pill" color="orange">
              {topic.unreadCount === 1
                ? '1 new reply'
                : `${topic.unreadCount} new replies`}
            </Badge>
          ) : null}
          {topic.status === 'CLOSED' ? (
            <Badge variant="pill" color="secondary">
              Closed
            </Badge>
          ) : null}
          {topic.following ? (
            <Badge variant="pill" color="secondary">
              {topic.muted ? (
                <>
                  <BellOffIcon size={12} aria-hidden /> Muted
                </>
              ) : (
                'Following'
              )}
            </Badge>
          ) : null}
        </span>
        <span className="text-foreground-secondary text-xs">
          Started by {topic.createdBy} ·{' '}
          {topic.postCount === 1 ? '1 reply' : `${topic.postCount} replies`} ·
          {topic.lastReplyBy
            ? `last reply by ${topic.lastReplyBy}, ${lastActivity(topic.lastPostAt)}`
            : `last activity ${lastActivity(topic.lastPostAt)}`}
        </span>
      </Link>
    </li>
  );
}

export function DiscussionsView() {
  const user = useAuthStore((s) => s.user);
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<TopicFilter>('all');
  const shown = useMemo(
    () => topics.filter((topic) => matchesFilter(topic, filter)),
    [topics, filter],
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchDiscussionTopics().then((result) => {
      setTopics(result.data);
      setLoadError(
        result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
      );
      setLoading(false);
    });
  }, [user, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  return (
    <ViewShell
      title="Discussions"
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl', content: 'gap-4' }}
    >
      <Link
        to="/governance"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to governance
      </Link>
      <p className="text-foreground-secondary text-sm">
        Topics the board opened for members to talk through. Nothing here is a
        vote; replying follows a topic so you hear about new replies.
      </p>

      {!user ? (
        <PageEmpty
          icon="inbox"
          title="Sign in to read the discussions"
          description="Discussions are open to Tahti ry members."
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              Sign in
            </Button>
          }
        />
      ) : loading ? (
        <PageLoading label="Loading discussions…" />
      ) : loadError && topics.length === 0 ? (
        <PageError
          title="Could not load the discussions"
          description={loadError}
          onRetry={retry}
        />
      ) : (
        <>
          {loadError ? (
            <PageErrorBanner
              title="Could not refresh the discussions."
              description={loadError}
              onRetry={retry}
            />
          ) : null}
          {topics.length === 0 ? (
            <PageEmpty
              icon="inbox"
              title="No discussions yet"
              description="When the board opens a topic, it shows up here and you get a notification."
            />
          ) : (
            <>
              <FilterChips
                items={FILTERS}
                selected={filter}
                onChange={(id) => setFilter(id as TopicFilter)}
                aria-label="Filter discussions"
              />
              {shown.length === 0 ? (
                <PageEmpty
                  icon="inbox"
                  title="No topics here"
                  description="Try another filter."
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setFilter('all')}
                    >
                      Show all
                    </Button>
                  }
                />
              ) : (
                <ul
                  className="flex flex-col gap-2"
                  aria-label="Discussion topics"
                >
                  {shown.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} />
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </ViewShell>
  );
}
