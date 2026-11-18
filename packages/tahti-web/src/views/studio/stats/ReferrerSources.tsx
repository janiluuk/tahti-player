import { ExternalLinkIcon, LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { SegmentedControl, ShareList } from '@tahti-player/ui';

import {
  fetchStatsAudience,
  type StatsAudience,
  type StatsAudienceWindow,
} from '../../../api/studio-extras';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { dateLocaleTag } from '../../../lib/locale';
import {
  DIRECT,
  isHttpReferrerUrl,
  OTHER,
  referrerSourceLabel,
} from '../../../lib/referrerSourceLabel';

type ReferrerMode = 'host' | 'url';

export function ReferrerSources({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const { t } = useTranslation('web');
  const [mode, setMode] = useState<ReferrerMode>('host');
  const [sources, setSources] = useState<StatsAudience | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [reloadKey, setReloadKey] = useState(0);
  const { range, from, to, soundId } = window;
  const dimension = mode === 'url' ? 'referrerUrl' : 'source';

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetchStatsAudience(dimension, { range, from, to, soundId }).then(
      (result) => {
        if (cancelled) {
          return;
        }
        if (result.meta.source === 'api' && result.meta.reason) {
          setStatus('error');
          return;
        }
        setSources(result.data);
        setStatus('ready');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [range, from, to, soundId, reloadKey, dimension]);

  const items = sources?.items ?? [];
  const minBucket = sources?.minBucket ?? 5;
  const locale = dateLocaleTag();

  return (
    <StudioPanel
      title={t('referrerSources.whereListenersCameFrom')}
      description={
        mode === 'url'
          ? t('referrerSourcesLabels.thePageAListenerWas', { minBucket })
          : t('referrerSourcesLabels.theSiteAListenerWas', { minBucket })
      }
      action={
        <SegmentedControl
          aria-label={t('referrerSources.groupBy')}
          options={[
            { id: 'host', label: t('referrerSources.sites') },
            { id: 'url', label: t('referrerSources.pages') },
          ]}
          value={mode}
          onChange={setMode}
        />
      }
    >
      {status === 'loading' ? (
        <PageLoading label={t('loading.loadingSources')} />
      ) : status === 'error' ? (
        <PageError
          title={t('loadErrors.couldNotLoadWhereListenersCame')}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : (
        <ShareList
          data-testid="stats-referrers"
          aria-label={
            mode === 'url'
              ? t('referrerSources.referringPages')
              : t('referrerSources.referringSites')
          }
          emptyLabel="Sources fill in as people listen."
          items={items.map((item) => {
            const label = referrerSourceLabel(
              item.name,
              item.count,
              mode,
              locale,
            );
            const linkable =
              mode === 'url' &&
              item.name !== DIRECT &&
              item.name !== OTHER &&
              isHttpReferrerUrl(item.name);
            return {
              id: item.name,
              label,
              share: item.share,
              title:
                mode === 'url' && item.name !== DIRECT && item.name !== OTHER
                  ? item.name
                  : undefined,
              href: linkable ? item.name : undefined,
              icon:
                item.name === DIRECT || item.name === OTHER ? (
                  <LinkIcon size={14} />
                ) : (
                  <ExternalLinkIcon size={14} />
                ),
            };
          })}
        />
      )}
    </StudioPanel>
  );
}
