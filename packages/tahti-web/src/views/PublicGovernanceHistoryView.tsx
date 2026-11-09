import { ScrollTextIcon } from 'lucide-react';

import 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Box,
  ButtonLink,
  SectionTitle,
  StatChip,
  ViewShell,
} from '@tahti-player/ui';

import { fetchPublicGovernanceMotions } from '../api/client';
import type { PublicGovernanceMotion } from '../api/types';
import { ListingDate } from '../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageErrorBanner,
  PageLoading,
} from '../components/PageStates';
import { isPlausiblePublicName } from '../lib/publicDisplayName';
import { apiResult, useSnapshotFetch } from '../lib/useSnapshotFetch';

export function PublicGovernanceHistoryView() {
  const { t } = useTranslation('web');
  const snapshot = useSnapshotFetch<PublicGovernanceMotion[]>(
    'public-governance-history',
    async () =>
      apiResult(await fetchPublicGovernanceMotions()).filter((motion) => {
        const title = motion.title?.trim();
        return !title || isPlausiblePublicName(title);
      }),
  );
  const motions = snapshot.data ?? [];
  const { loading, error: loadError, retry } = snapshot;

  return (
    <ViewShell
      title={t('publicGovernanceHistoryViewText.governanceHistory')}
      classes={{ root: 'px-0 pt-0 mx-auto max-w-3xl', content: 'gap-6' }}
    >
      <ButtonLink
        className="w-fit"
        to="/governance"
        size="sm"
        variant="secondary"
      >
        <ScrollTextIcon size={14} aria-hidden className="mr-1.5" />← Governance
      </ButtonLink>

      {!loading && motions.length > 0 && (
        <StatChip
          value={motions.length}
          label={t('governancePublic.closedMotions')}
        />
      )}

      {loading ? (
        <PageLoading label={t('governancePublic.historyLoading')} />
      ) : loadError && motions.length === 0 ? (
        <PageError
          title={t('governancePublic.historyLoadError')}
          description={loadError}
          onRetry={() => {
            retry();
          }}
        />
      ) : motions.length === 0 ? (
        <PageEmpty title={t('governancePublic.noClosedMotions')} />
      ) : (
        <div className="flex flex-col gap-4">
          {loadError ? (
            <PageErrorBanner
              title={t('governancePublic.historyRefreshError')}
              description={loadError}
              onRetry={() => {
                retry();
              }}
            />
          ) : null}
          {motions.map((motion) => (
            <Box
              key={motion.id}
              variant="tertiary"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <SectionTitle
                    title={motion.title}
                    wrap
                    className="font-display"
                  />
                  <p className="text-foreground-secondary mt-1 text-xs">
                    Proposed by {motion.proposer} · Closed{' '}
                    <ListingDate value={motion.closedAt} />
                  </p>
                </div>
                <Badge variant="pill" color="secondary">
                  {t('governancePublic.closed')}
                </Badge>
              </div>
              <p className="text-sm">{motion.description}</p>
              <p className="text-foreground-secondary text-xs">
                YES {motion.voteFor} · NO {motion.voteAgainst} · ABSTAIN{' '}
                {motion.voteAbstain}
              </p>
            </Box>
          ))}
        </div>
      )}
    </ViewShell>
  );
}
