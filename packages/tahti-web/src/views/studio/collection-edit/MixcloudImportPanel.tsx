import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Button,
  Input,
  MediaArtwork,
  SegmentedControl,
} from '@tahti-player/ui';

import {
  addMixcloudCloudcast,
  fetchMixcloudProfileCloudcasts,
  fetchMyMixcloudCloudcasts,
  mixcloudCoverUrl,
  searchMixcloud,
  type MixcloudCloudcast,
} from '../../../api/sources/mixcloud';
import { StudioPanel } from '../../../components/StudioPanel';

type Mode = 'search' | 'mine' | 'profile';

const MODES = [
  { id: 'search', label: 'Search Mixcloud' },
  { id: 'mine', label: 'Your mixes' },
  { id: 'profile', label: 'By profile URL' },
] as const;

function formatDuration(sec: number): string {
  const minutes = Math.floor(Math.max(0, sec) / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
    : `${minutes} min`;
}

export function MixcloudImportPanel({
  collectionId,
  onAdded,
}: {
  collectionId: string;
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MixcloudCloudcast[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());

  const load = async (next: Mode, value: string) => {
    if (next !== 'mine' && !value.trim()) {
      return;
    }
    setBusy(true);
    const res =
      next === 'mine'
        ? await fetchMyMixcloudCloudcasts()
        : next === 'profile'
          ? await fetchMixcloudProfileCloudcasts(value.trim())
          : await searchMixcloud(value.trim());
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      setResults([]);
      return;
    }
    setResults(res.data);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setResults(null);
    setQuery('');
    if (next === 'mine') {
      void load('mine', '');
    }
  };

  const add = async (cloudcast: MixcloudCloudcast) => {
    setAddingUrl(cloudcast.url);
    const res = await addMixcloudCloudcast(collectionId, cloudcast.url);
    setAddingUrl(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAdded((current) => new Set(current).add(cloudcast.url));
    toast.success(`${cloudcast.title} added.`);
    onAdded();
  };

  return (
    <StudioPanel
      title="Add from Mixcloud"
      description="Cloudcasts are embedded from Mixcloud; Tahti never copies the audio."
    >
      <div className="flex flex-col gap-3">
        <SegmentedControl
          aria-label="Mixcloud source"
          options={MODES}
          value={mode}
          onChange={switchMode}
          className="w-fit flex-wrap"
        />
        {mode !== 'mine' ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void load(mode, query);
            }}
          >
            <Input
              className="flex-1"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={
                mode === 'profile' ? 'Mixcloud profile URL' : 'Search Mixcloud'
              }
              placeholder={
                mode === 'profile'
                  ? 'https://www.mixcloud.com/artist/'
                  : 'Search cloudcasts…'
              }
            />
            <Button type="submit" disabled={busy || !query.trim()}>
              {busy ? 'Looking…' : 'Find'}
            </Button>
          </form>
        ) : null}
        {results === null ? null : results.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            {mode === 'mine'
              ? 'No mixes found. Add your Mixcloud handle to your social links first.'
              : 'No cloudcasts found.'}
          </p>
        ) : (
          <ul aria-label="Mixcloud cloudcasts" className="flex flex-col gap-2">
            {results.map((cloudcast) => (
              <li
                key={cloudcast.url}
                className="flex items-center gap-3 text-sm"
              >
                <MediaArtwork
                  size="thumb"
                  src={
                    cloudcast.coverUrl
                      ? mixcloudCoverUrl(cloudcast.coverUrl)
                      : null
                  }
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cloudcast.title}</p>
                  <p className="text-foreground-secondary truncate text-xs">
                    {cloudcast.displayName || cloudcast.username} ·{' '}
                    {formatDuration(cloudcast.durationSec)}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={
                    addingUrl === cloudcast.url || added.has(cloudcast.url)
                  }
                  onClick={() => void add(cloudcast)}
                >
                  <PlusIcon size={15} aria-hidden className="mr-1" />
                  {added.has(cloudcast.url)
                    ? 'Added'
                    : addingUrl === cloudcast.url
                      ? 'Adding…'
                      : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudioPanel>
  );
}
