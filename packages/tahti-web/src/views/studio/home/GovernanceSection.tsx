import { Link } from '@tanstack/react-router';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import { PageError } from '../../../components/PageStates';
import { Group } from './HomeTiles';
import type { StudioHomeState } from './useStudioHome';

type GovernanceItem = {
  id: string;
  title: string;
  detail: string;
  to: '/governance' | '/governance/feature-requests';
};

function GovernanceList({
  items,
  empty,
}: {
  items: GovernanceItem[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-foreground-secondary text-sm">{empty}</p>;
  }
  return (
    <ul className="divide-border divide-y">
      {items.map((item) => (
        <li key={item.id} className="py-2 first:pt-0 last:pb-0">
          <Link to={item.to} className="block hover:underline">
            <span className="block truncate text-sm font-medium">
              {item.title}
            </span>
            <span className="text-foreground-secondary text-xs">
              {item.detail}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Studio home's Co-op summary. Nothing to act on collapses to one line
 * instead of two empty states. */
export function GovernanceSection({ state }: { state: StudioHomeState }) {
  const { t } = useTranslation('web');
  const {
    governanceVotes,
    unresolvedRequests,
    discussionUpdates,
    governanceError,
    reloadGovernance,
  } = state;

  if (governanceError) {
    return (
      <Group title={t('studioHub.governance')}>
        <PageError
          title={t('studioHub.governanceLoadError')}
          description={governanceError}
          onRetry={reloadGovernance}
        />
      </Group>
    );
  }

  const votes: GovernanceItem[] = [
    ...governanceVotes.map((motion) => ({
      id: `motion-${motion.id}`,
      title: motion.title,
      detail: t('governanceSection.openMotion'),
      to: '/governance' as const,
    })),
    ...unresolvedRequests
      .filter((request) => !request.youVoted)
      .map((request) => ({
        id: `request-${request.id}`,
        title: request.title,
        detail: t('governanceSection.openTopic'),
        to: '/governance/feature-requests' as const,
      })),
  ].slice(0, 4);
  const openLink = (
    <ButtonLink
      to="/governance"
      size="xs"
      variant="text"
      data-testid="studio-home-open-coop"
    >
      {t('governanceSection.openCoop')}
    </ButtonLink>
  );

  if (votes.length === 0 && discussionUpdates.length === 0) {
    return (
      <Group title={t('studioHub.governance')}>
        <div className="border-border flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
          <p className="text-foreground-secondary text-sm">
            {t('governanceSection.nothingToDo')}
          </p>
          {openLink}
        </div>
      </Group>
    );
  }

  return (
    <Group title={t('studioHub.governance')}>
      <div className="border-border bg-background-secondary/30 @container rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold">
              {t('governanceSection.haveYourSay')}
            </p>
            <p className="text-foreground-secondary mt-1 text-xs">
              {t('governanceSection.reviewOpenVotesAndFollow')}
            </p>
          </div>
          {openLink}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 @xl:grid-cols-2">
          <div>
            <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
              {t('governanceSection.needsYourOpinion')}
            </p>
            <GovernanceList
              items={votes}
              empty={t('studioHub.governanceEmptyVotes')}
            />
          </div>
          <div>
            <p className="text-foreground-secondary mb-2 text-xs font-semibold tracking-wide uppercase">
              {t('governanceSection.ongoingDiscussions')}
            </p>
            <GovernanceList
              items={discussionUpdates}
              empty={t('studioHub.governanceEmptyDiscussions')}
            />
          </div>
        </div>
      </div>
    </Group>
  );
}
