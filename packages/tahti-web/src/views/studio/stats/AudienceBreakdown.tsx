import {
  BotIcon,
  CircleHelpIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { ShareList, Toggle } from '@tahti-player/ui';

import {
  fetchStatsAudience,
  type StatsAudience,
  type StatsAudienceDimension,
  type StatsAudienceWindow,
} from '../../../api/studio-extras';
import { PageError, PageLoading } from '../../../components/PageStates';
import { StudioPanel } from '../../../components/StudioPanel';

const DIMENSIONS: { id: StatsAudienceDimension; title: string }[] = [
  { id: 'browser', title: 'Browser' },
  { id: 'os', title: 'OS versions' },
  { id: 'deviceType', title: 'Device type' },
  { id: 'deviceVendor', title: 'Device company' },
  { id: 'source', title: 'Source' },
  { id: 'surface', title: 'Listened on' },
];

const SURFACE_LABELS: Record<string, string> = {
  CHANNEL_PAGE: 'Channel page',
  TAHTI_RADIO: 'Tahti Radio',
  ARTIST_PROFILE: 'Artist profile',
  DISCOVER: 'Discover',
  LIBRARY: 'Library',
  EMBED: 'Embeds',
  OTHER: 'Elsewhere on Tahti',
};

const DEVICE_ICONS: Record<string, ReactNode> = {
  Desktop: <MonitorIcon size={14} />,
  Smartphone: <SmartphoneIcon size={14} />,
  Tablet: <TabletIcon size={14} />,
  Bot: <BotIcon size={14} />,
  Unknown: <CircleHelpIcon size={14} />,
};

export function AudienceBreakdown({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const [ignoreBots, setIgnoreBots] = useState(true);
  const [audience, setAudience] = useState<
    Partial<Record<StatsAudienceDimension, StatsAudience>>
  >({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [reloadKey, setReloadKey] = useState(0);
  const { range, from, to, soundId } = window;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const query = { range, from, to, soundId, includeBots: !ignoreBots };
    void Promise.all(
      DIMENSIONS.map(({ id }) => fetchStatsAudience(id, query)),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      if (
        results.some(
          (result) => result.meta.source === 'api' && result.meta.reason,
        )
      ) {
        setStatus('error');
        return;
      }
      setAudience(
        Object.fromEntries(
          results.map((result) => [result.data.dimension, result.data]),
        ),
      );
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [range, from, to, soundId, ignoreBots, reloadKey]);

  const total = audience.browser?.total ?? 0;
  const minBucket = audience.browser?.minBucket ?? 5;

  return (
    <StudioPanel
      title="Audience"
      description={`Shares of listens in this period. Names with fewer than ${minBucket} listens are grouped as Other.`}
      action={
        <Toggle
          label="Ignore bot traffic"
          showLabel
          checked={ignoreBots}
          onChange={setIgnoreBots}
        />
      }
    >
      {status === 'loading' ? (
        <PageLoading label="Loading audience…" />
      ) : status === 'error' ? (
        <PageError
          title="Could not load the audience breakdown"
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : total === 0 ? (
        <p className="text-foreground-secondary text-sm">
          The breakdown fills in as people listen.
        </p>
      ) : (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="stats-audience"
        >
          {DIMENSIONS.map(({ id, title }) => (
            <ShareList
              key={id}
              title={title}
              headingLevel={3}
              items={(audience[id]?.items ?? []).map((item) => ({
                id: item.name,
                label:
                  id === 'surface'
                    ? (SURFACE_LABELS[item.name] ?? item.name)
                    : item.name,
                share: item.share,
                icon: id === 'deviceType' ? DEVICE_ICONS[item.name] : undefined,
              }))}
            />
          ))}
        </div>
      )}
    </StudioPanel>
  );
}
