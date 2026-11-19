import { Link } from '@tanstack/react-router';
import {
  BellOffIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  PinIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, FilterChips, ViewShell } from '@tahti-player/ui';

import {
  fetchDiscussionTopics,
  markAllDiscussionsRead,
  type DiscussionTopic,
} from '../api/governance-discussions';
import {
  governanceAccentChip,
  GovernancePanel,
} from '../components/governance/GovernancePanel';
import { ListingDate } from '../components/ListingDate';
import { PageBackLink } from '../components/PageBackLink';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { cn } from '../lib/cn';
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

function TopicRow({ topic }: { topic: DiscussionTopic }) {
  const { t } = useTranslation('web');
  const unread = Boolean(topic.unreadCount);
  return (
    <li>
      <Link
        to="/governance/discussions/$id"
        params={{ id: topic.id }}
        className="group hover:bg-background-secondary/60 -mx-2 flex items-start gap-3 rounded-md px-2 py-3"
      >
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-md',
            topic.status === 'CLOSED'
              ? 'bg-background-secondary text-foreground-secondary'
              : governanceAccentChip(unread ? 'orange' : 'cyan'),
          )}
        >
          {topic.pinned ? (
            <PinIcon size={16} aria-label={t('discussionsPage.pinned')} />
          ) : (
            <MessagesSquareIcon size={16} aria-hidden />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'font-display text-base group-hover:underline',
                unread ? 'font-bold' : 'font-semibold',
              )}
            >
              {topic.title}
            </span>
            {unread ? (
              <Badge variant="pill" color="orange">
                {topic.unreadCount === 1
                  ? '1 new reply'
                  : `${topic.unreadCount} new replies`}
              </Badge>
            ) : null}
            {topic.status === 'CLOSED' ? (
              <Badge variant="pill" color="secondary">
                {t('discussionsPage.closed')}
              </Badge>
            ) : null}
            {topic.following ? (
              <Badge variant="pill" color="secondary">
                {topic.muted ? (
                  <>
                    <BellOffIcon size={12} aria-hidden />{' '}
                    {t('discussionsPage.muted')}
                  </>
                ) : (
                  'Following'
                )}
              </Badge>
            ) : null}
          </span>
          <span className="text-foreground-secondary flex flex-wrap items-center gap-x-1 text-xs">
            <span>
              Started by {topic.createdBy} ·{' '}
              {topic.lastReplyBy
                ? `last reply by ${topic.lastReplyBy}`
                : 'last activity'}
            </span>
            <ListingDate value={topic.lastPostAt} />
          </span>
        </span>
        <span className="text-foreground-secondary flex shrink-0 items-center gap-1 self-center text-xs">
          <MessageSquareIcon size={14} aria-hidden />
          {topic.postCount === 1 ? '1 reply' : `${topic.postCount} replies`}
        </span>
      </Link>
    </li>
  );
}

export function DiscussionsView() {
  const { t } = useTranslation('web');
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
      title={t('discussionsPage.discussions')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-2xl', content: 'gap-4' }}
    >
      <PageBackLink to="/governance" label={t('discussionsPage.governance')} />
      <p className="text-foreground-secondary text-sm">
        {t('discussionsPage.topicsTheBoardOpenedFor')}
      </p>
      {!user ? (
        <PageEmpty
          icon="inbox"
          title={t('empties.signInToReadTheDiscussions')}
          description={t('empties.discussionsAreOpenToTahtiRy')}
          action={
            <Button onClick={() => useAuthModalStore.getState().open('login')}>
              {t('discussionsPage.signIn')}
            </Button>
          }
        />
      ) : loading ? (
        <PageLoading label={t('loading.loadingDiscussions')} />
      ) : loadError && topics.length === 0 ? (
        <PageError
          title={t('loadErrors.couldNotLoadTheDiscussions')}
          description={loadError}
          onRetry={retry}
        />
      ) : (
        <>
          {loadError ? (
            <PageErrorBanner
              title={t('loadErrors.couldNotRefreshTheDiscussions')}
              description={loadError}
              onRetry={retry}
            />
          ) : null}
          {topics.length === 0 ? (
            <PageEmpty
              icon="inbox"
              title={t('empties.noDiscussionsYet')}
              description={t('empties.whenTheBoardOpensATopic')}
            />
          ) : (
            <GovernancePanel
              title={t('discussionsPage.discussionTopics')}
              icon={MessagesSquareIcon}
              accent="cyan"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FilterChips
                  items={FILTERS}
                  selected={filter}
                  onChange={(id) => setFilter(id as TopicFilter)}
                  aria-label={t('discussionsPage.filterDiscussions')}
                />
                {topics.some((topic) => topic.unreadCount) ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void markAllDiscussionsRead().then((result) => {
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        setTopics((all) =>
                          all.map((topic) => ({ ...topic, unreadCount: 0 })),
                        );
                      })
                    }
                  >
                    {t('discussionsPage.markAllRead')}
                  </Button>
                ) : null}
              </div>
              {shown.length === 0 ? (
                <PageEmpty
                  icon="inbox"
                  title={t('empties.noTopicsHere')}
                  description={t('empties.tryAnotherFilter')}
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setFilter('all')}
                    >
                      {t('discussionsPage.showAll')}
                    </Button>
                  }
                />
              ) : (
                <ul
                  className="divide-border flex flex-col divide-y"
                  aria-label={t('discussionsPage.discussionTopics')}
                >
                  {shown.map((topic) => (
                    <TopicRow key={topic.id} topic={topic} />
                  ))}
                </ul>
              )}
            </GovernancePanel>
          )}
        </>
      )}
    </ViewShell>
  );
}
