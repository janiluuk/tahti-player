import {
  AlertTriangleIcon,
  CheckIcon,
  EyeIcon,
  ListFilterIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import {
  fetchAdminMissedShows,
  updateAdminMissedShow,
  type AdminMissedShow,
  type AdminMissedShowStatus,
} from '../../api/admin';
import { ListingDate } from '../../components/ListingDate';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';
import { ModerationTabs } from './moderation/ModerationTabs';

const FILTER_IDS = [
  'ALL',
  'OPEN',
  'REVIEWING',
  'ACTIONED',
  'DISMISSED',
] as const satisfies ReadonlyArray<AdminMissedShowStatus | 'ALL'>;

const FILTER_LABEL_KEYS: Record<(typeof FILTER_IDS)[number], string> = {
  ALL: 'adminMissedShows.filterAll',
  OPEN: 'adminMissedShows.filterOpen',
  REVIEWING: 'adminMissedShows.filterReviewing',
  ACTIONED: 'adminMissedShows.filterActioned',
  DISMISSED: 'adminMissedShows.filterDismissed',
};

const FILTER_TAB_ICONS = {
  ALL: ListFilterIcon,
  OPEN: AlertTriangleIcon,
  REVIEWING: EyeIcon,
  ACTIONED: CheckIcon,
  DISMISSED: XIcon,
};

export function AdminMissedShowsPanel() {
  const { t } = useTranslation('web');
  const [filter, setFilter] = useState<(typeof FILTER_IDS)[number]>('ALL');
  const [flags, setFlags] = useState<AdminMissedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = (nextFilter: (typeof FILTER_IDS)[number]) => {
    setLoading(true);
    setError(null);
    void fetchAdminMissedShows(
      nextFilter === 'ALL' ? undefined : nextFilter,
    ).then((result) => {
      setFlags(result.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load('ALL');
  }, []);

  const setStatus = async (
    flag: AdminMissedShow,
    status: AdminMissedShowStatus,
  ) => {
    setBusyId(flag.id);
    const result = await updateAdminMissedShow(flag.id, status);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFlags((current) =>
      current.map((item) => (item.id === flag.id ? { ...item, status } : item)),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <StudioPanel>
        <ModerationTabs
          activeId={filter}
          items={FILTER_IDS.map((id) => ({
            id,
            label: t(FILTER_LABEL_KEYS[id] as 'adminMissedShows.filterAll'),
            icon: FILTER_TAB_ICONS[id],
          }))}
          ariaLabel={t('adminMissedShows.statusAria')}
          onChange={(id) => {
            const nextFilter = id as (typeof FILTER_IDS)[number];
            setFilter(nextFilter);
            load(nextFilter);
          }}
        />
      </StudioPanel>

      <StudioPanel
        title={t('adminMissedShows.queueTitle', { count: flags.length })}
      >
        {loading ? (
          <PageLoading label={t('adminMissedShows.loading')} />
        ) : error ? (
          <PageError description={error} />
        ) : flags.length === 0 ? (
          <PageEmpty title={t('adminPages.missedShowsEmpty')} />
        ) : (
          <ul className="divide-border divide-y">
            {flags.map((flag) => (
              <li
                key={flag.id}
                className="flex flex-wrap items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <AlertTriangleIcon
                  size={17}
                  aria-hidden
                  className="text-accent-orange-strong mt-0.5 shrink-0"
                />
                <div className="min-w-0 flex-1 basis-40">
                  <div className="font-medium">
                    {flag.scheduledLiveShow.title}
                  </div>
                  <div className="text-foreground-secondary text-xs">
                    {flag.channel.displayName} · @{flag.channel.username}
                  </div>
                  <div className="text-foreground-secondary mt-1 text-xs">
                    Scheduled{' '}
                    <ListingDate value={flag.scheduledLiveShow.startAt} /> ·
                    detected <ListingDate value={flag.detectedAt} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1.5">
                  {flag.status !== 'REVIEWING' && (
                    <Tooltip
                      content={t('adminMissedShows.markReviewing')}
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={t(
                          'adminMissedShowsViewLabels.markTitleAsReviewing',
                          { title: flag.scheduledLiveShow.title },
                        )}
                        disabled={busyId === flag.id}
                        onClick={() => void setStatus(flag, 'REVIEWING')}
                      >
                        <EyeIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  )}
                  {flag.status !== 'ACTIONED' && (
                    <Tooltip
                      content={t('adminMissedShows.markActioned')}
                      side="top"
                    >
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={t(
                          'adminMissedShowsViewLabels.markTitleAsActioned',
                          { title: flag.scheduledLiveShow.title },
                        )}
                        disabled={busyId === flag.id}
                        onClick={() => void setStatus(flag, 'ACTIONED')}
                      >
                        <CheckIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  )}
                  {flag.status !== 'DISMISSED' && (
                    <Tooltip content={t('adminMissedShows.dismiss')} side="top">
                      <Button
                        size="icon-sm"
                        variant="secondary"
                        aria-label={t(
                          'adminMissedShowsViewLabels.dismissTitle',
                          { title: flag.scheduledLiveShow.title },
                        )}
                        disabled={busyId === flag.id}
                        onClick={() => void setStatus(flag, 'DISMISSED')}
                      >
                        <XIcon size={14} aria-hidden />
                      </Button>
                    </Tooltip>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
    </div>
  );
}
