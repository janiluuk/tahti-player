import { ExternalLinkIcon, LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { ShareList } from '@tahti-player/ui';

import {
  fetchStatsAudience,
  type StatsAudience,
  type StatsAudienceWindow,
} from '../../../api/studio-extras';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';
import { dateLocaleTag } from '../../../lib/locale';

const DIRECT = 'Direct';
const OTHER = 'Other';

function sourceLabel(name: string, count: number): string {
  const listens = `${count.toLocaleString(dateLocaleTag())} ${count === 1 ? 'listen' : 'listens'}`;
  if (name === DIRECT) {
    return `Direct or unknown · ${listens}`;
  }
  if (name === OTHER) {
    return `Other sites · ${listens}`;
  }
  return `${name} · ${listens}`;
}

export function ReferrerSources({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const { t } = useTranslation('web');
  const [sources, setSources] = useState<StatsAudience | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [reloadKey, setReloadKey] = useState(0);
  const { range, from, to, soundId } = window;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    void fetchStatsAudience('source', { range, from, to, soundId }).then(
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
  }, [range, from, to, soundId, reloadKey]);

  const items = sources?.items ?? [];
  const minBucket = sources?.minBucket ?? 5;

  return (
    <StudioPanel
      title={t('referrerSources.whereListenersCameFrom')}
      description={t('referrerSourcesLabels.theSiteAListenerWas', {
        minBucket,
      })}
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
          aria-label={t('referrerSources.referringSites')}
          emptyLabel="Sources fill in as people listen."
          items={items.map((item) => ({
            id: item.name,
            label: sourceLabel(item.name, item.count),
            share: item.share,
            icon:
              item.name === DIRECT || item.name === OTHER ? (
                <LinkIcon size={14} />
              ) : (
                <ExternalLinkIcon size={14} />
              ),
          }))}
        />
      )}
    </StudioPanel>
  );
}
