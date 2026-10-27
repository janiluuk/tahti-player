import { useEffect, useState } from 'react';

import { ShareList } from '@tahti-player/ui';

import {
  fetchStatsLocations,
  type StatsAudienceWindow,
  type StatsLocation,
  type StatsLocations,
} from '../../../api/studio-extras';
import { PageError } from '../../../components/PageStates';
import { countryName, flagEmoji } from '../../../lib/countries';

function countryLabel(location: StatsLocation): string {
  return location.countryCode
    ? countryName(location.countryCode)
    : location.name;
}

export function ListenerLocations({
  window,
}: {
  window: Omit<StatsAudienceWindow, 'includeBots'>;
}) {
  const [locations, setLocations] = useState<StatsLocations | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const { range, from, to, soundId } = window;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    void fetchStatsLocations({ range, from, to, soundId }).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.meta.source === 'api' && result.meta.reason) {
        setFailed(true);
        return;
      }
      setLocations(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [range, from, to, soundId, reloadKey]);

  if (failed) {
    return (
      <PageError
        title="Could not load listener locations"
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }
  if (!locations) {
    return null;
  }
  const minBucket = locations.minBucket;

  return (
    <div
      className="mt-4 grid gap-6 sm:grid-cols-2"
      data-testid="stats-locations"
    >
      <ShareList
        title="Countries"
        items={locations.countries.map((location) => ({
          id: location.name,
          label: countryLabel(location),
          share: location.share,
          icon: location.countryCode ? (
            <span>{flagEmoji(location.countryCode)}</span>
          ) : undefined,
        }))}
        emptyLabel="Countries show as people listen."
      />
      <ShareList
        title="Cities"
        items={locations.cities.map((location) => ({
          id: `${location.countryCode ?? ''}-${location.name}`,
          label: location.name,
          share: location.share,
          icon: location.countryCode ? (
            <span>{flagEmoji(location.countryCode)}</span>
          ) : undefined,
        }))}
        emptyLabel={`Cities show once at least ${minBucket} listens share one.`}
      />
    </div>
  );
}
