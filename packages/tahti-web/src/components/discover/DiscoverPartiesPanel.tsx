import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ButtonLink } from '@tahti-player/ui';

import type { FetchMeta } from '../../api/client';
import {
  fetchPublicListeningParties,
  type ListeningPartySummaryDto,
} from '../../api/listening-parties';
import { useAuthStore } from '../../stores/authStore';
import { ListeningPartyList } from '../listening-party/ListeningPartyList';
import { PageEmpty, PageError, PageLoading } from '../PageStates';
import { StudioPanel } from '../StudioPanel';

function apiReason(meta: FetchMeta): string | null {
  return meta.source === 'api' && meta.reason ? meta.reason : null;
}

function usePublicParties(limit: number, reloadKey = 0) {
  const [parties, setParties] = useState<ListeningPartySummaryDto[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setParties(null);
    void fetchPublicListeningParties(limit).then((result) => {
      if (!cancelled) {
        setParties(result.data);
        setError(apiReason(result.meta));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [limit, reloadKey]);
  return { parties, error };
}

export function DiscoverPartiesPanel() {
  const { t } = useTranslation('web');
  const user = useAuthStore((state) => state.user);
  const [reloadKey, setReloadKey] = useState(0);
  const { parties, error } = usePublicParties(50, reloadKey);

  return (
    <div className="flex flex-col gap-4" data-testid="discover-parties">
      {user?.channel ? (
        <header className="flex flex-wrap items-center gap-2">
          <ButtonLink
            to="/studio/listening-parties/new"
            size="sm"
            className="gap-1.5"
          >
            <PlusIcon size={15} aria-hidden />
            {t('discoverParties.startParty')}
          </ButtonLink>
        </header>
      ) : null}
      {parties === null ? (
        <PageLoading label={t('discoverParties.loading')} />
      ) : error && parties.length === 0 ? (
        <PageError
          title={t('discoverParties.loadFailed')}
          description={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : parties.length === 0 ? (
        <PageEmpty
          title={t('discoverParties.emptyTitle')}
          description={t('discoverParties.emptyDescription')}
        />
      ) : (
        <ListeningPartyList parties={parties} />
      )}
    </div>
  );
}

export function DiscoverPartiesRow() {
  const { t } = useTranslation('web');
  const { parties } = usePublicParties(3);
  if (!parties || parties.length === 0) {
    return null;
  }
  return (
    <StudioPanel
      title={t('discoverParties.rowTitle')}
      action={
        <ButtonLink
          to="/discover"
          search={{ tab: 'parties' }}
          size="sm"
          variant="text"
          className="gap-1.5"
        >
          {t('discoverParties.seeAll')}
          <ArrowRightIcon size={14} aria-hidden />
        </ButtonLink>
      }
    >
      <ListeningPartyList
        parties={parties}
        data-testid="discover-parties-row"
      />
    </StudioPanel>
  );
}
