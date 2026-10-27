import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, ButtonLink, SectionShell } from '@tahti-player/ui';

import {
  fetchDiscussionTopics,
  type DiscussionTopic,
} from '../../api/governance-discussions';

const SHOWN = 3;

/** Governance: the most active open discussions, so members see new topics
 * and replies without opening the list. Hidden when there are none or the
 * list can't load (Discussions has its own error state). */
export function LatestDiscussionsPanel() {
  const [topics, setTopics] = useState<DiscussionTopic[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchDiscussionTopics().then((result) => {
      if (!cancelled) {
        setTopics(
          result.data
            .filter((topic) => topic.status === 'OPEN')
            .slice(0, SHOWN),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (topics.length === 0) {
    return null;
  }

  return (
    <SectionShell title="Latest discussions">
      <ul className="flex flex-col gap-2" aria-label="Latest discussions">
        {topics.map((topic) => (
          <li key={topic.id} className="flex flex-wrap items-center gap-2">
            <Link
              to="/governance/discussions/$id"
              params={{ id: topic.id }}
              className="font-medium hover:underline"
            >
              {topic.title}
            </Link>
            <span className="text-foreground-secondary text-xs">
              {topic.postCount === 1 ? '1 reply' : `${topic.postCount} replies`}
            </span>
            {topic.unreadCount ? (
              <Badge variant="pill" color="orange">
                {topic.unreadCount} new
              </Badge>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <ButtonLink to="/governance/discussions" size="sm" variant="secondary">
          All discussions
        </ButtonLink>
      </div>
    </SectionShell>
  );
}
