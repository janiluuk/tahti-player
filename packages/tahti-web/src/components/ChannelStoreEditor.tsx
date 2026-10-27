import { useEffect, useState } from 'react';

import { Input, Select } from '@tahti-player/ui';

import {
  fetchMyPurchaseTiers,
  setSoundAccess,
  type PurchaseTierRow,
  type SoundAccess,
} from '../api/purchase-tiers';
import { fetchStudioSounds } from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { PageEmpty, PageError, PageLoading } from './PageStates';
import { PurchaseTiersEditor } from './PurchaseTiersEditor';

const FANS_ONLY = '__fans';

function euros(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function priceLabel(tier: PurchaseTierRow): string {
  return tier.priceOptional
    ? `${tier.name} — pay what you want, suggested ${euros(tier.priceCents)}`
    : `${tier.name} — ${euros(tier.priceCents)}`;
}

function optionFor(sound: StudioSound): string {
  if (sound.accessMode === 'SUBSCRIBERS_ONLY') {
    return FANS_ONLY;
  }
  if (sound.accessMode === 'PURCHASE' && sound.purchaseTierId) {
    return sound.purchaseTierId;
  }
  return '';
}

function accessFor(option: string): SoundAccess {
  if (option === FANS_ONLY) {
    return { accessMode: 'SUBSCRIBERS_ONLY', purchaseTierId: null };
  }
  if (option) {
    return { accessMode: 'PURCHASE', purchaseTierId: option };
  }
  return { accessMode: 'FREE', purchaseTierId: null };
}

function inCatalog(sound: StudioSound): boolean {
  if (sound.accessMode === 'PURCHASE') {
    return true;
  }
  if (sound.visibility === 'STASH' || sound.visibility === 'PRIVATE') {
    return false;
  }
  return sound.isPublic !== false;
}

function StoreTrackAssigner({ revision }: { revision: number }) {
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [tiers, setTiers] = useState<PurchaseTierRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const reload = () => {
    void Promise.all([fetchStudioSounds(), fetchMyPurchaseTiers()]).then(
      ([soundsResult, tiersResult]) => {
        setSounds(soundsResult.data);
        setTiers(tiersResult.data);
        const failed =
          (soundsResult.meta.source === 'api' && soundsResult.meta.reason) ||
          (tiersResult.meta.source === 'api' && tiersResult.meta.reason);
        setLoadError(failed ? String(failed) : null);
        setLoaded(true);
      },
    );
  };

  useEffect(() => {
    reload();
  }, [revision]);

  const activeTiers = tiers.filter((tier) => tier.active);
  const catalog = sounds.filter(inCatalog);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? catalog.filter((sound) => sound.title.toLowerCase().includes(needle))
    : catalog;
  const inStore = catalog.filter(
    (sound) =>
      sound.accessMode === 'PURCHASE' &&
      activeTiers.some((tier) => tier.id === sound.purchaseTierId),
  );

  const assign = async (sound: StudioSound, option: string) => {
    setSavingId(sound.id);
    setRowError(null);
    const result = await setSoundAccess(sound.id, accessFor(option));
    setSavingId(null);
    if (!result.ok) {
      setRowError(result.error);
      return;
    }
    const next = accessFor(option);
    setSounds((rows) =>
      rows.map((row) =>
        row.id === sound.id
          ? {
              ...row,
              accessMode: next.accessMode,
              purchaseTierId: next.purchaseTierId,
            }
          : row,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">3. Put tracks in the Store</p>
        <p className="text-foreground-secondary text-xs">
          Pick a price on a track and it shows in the Store on your channel
          page. Choose “Not in the store” to take it out — anyone can play it
          again. Until you add a track, fans only see the prices themselves.
        </p>
      </div>
      {!loaded ? (
        <PageLoading label="Loading your tracks…" />
      ) : loadError && catalog.length === 0 ? (
        <PageError
          title="Could not load your tracks"
          description={loadError}
          onRetry={reload}
        />
      ) : activeTiers.length === 0 ? (
        <PageEmpty
          title="Add a price first"
          description="The list of tracks appears here once you have a price to put them on."
        />
      ) : (
        <>
          {inStore.length === 0 ? (
            <PageEmpty
              title="Nothing is in the Store yet"
              description="Choose a price on a track below. That track is what fans see."
            />
          ) : (
            <p className="text-foreground-secondary text-xs">
              In the Store now: {inStore.map((sound) => sound.title).join(', ')}
              .
            </p>
          )}
          <Input
            label="Search tracks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {visible.length === 0 ? (
            <PageEmpty
              title="No tracks match"
              description="Clear the search, or publish a track so it can go in the Store."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((sound) => (
                <li
                  key={sound.id}
                  className="border-border flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <p className="min-w-0 text-sm font-medium">{sound.title}</p>
                  <div className="w-full sm:w-72">
                    <Select
                      label={`Store price for ${sound.title}`}
                      options={[
                        { id: '', label: 'Not in the store' },
                        ...(sound.accessMode === 'SUBSCRIBERS_ONLY'
                          ? [{ id: FANS_ONLY, label: 'Fans only' }]
                          : []),
                        ...activeTiers.map((tier) => ({
                          id: tier.id,
                          label: priceLabel(tier),
                        })),
                      ]}
                      value={optionFor(sound)}
                      disabled={savingId === sound.id}
                      onValueChange={(value) => void assign(sound, value)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {rowError ? (
            <p className="text-accent-red-strong text-xs" role="alert">
              {rowError}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function ChannelStoreEditor() {
  const [revision, setRevision] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <ol className="text-foreground-secondary flex list-decimal flex-col gap-1 pl-5 text-sm">
        <li>
          Turn the Store on. It stays hidden on your channel page until you do.
        </li>
        <li>Add a price. That is what a fan pays for a track.</li>
        <li>
          Put tracks in the Store. Each track you price shows up in the section.
          Take a track out and it leaves the Store.
        </li>
      </ol>
      <PurchaseTiersEditor onChanged={() => setRevision((n) => n + 1)} />
      <StoreTrackAssigner revision={revision} />
    </div>
  );
}
