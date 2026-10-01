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
  addSpotifyTrack,
  fetchMySpotifyTracks,
  fetchSpotifyArtistTracks,
  searchSpotify,
  spotifyCoverUrl,
  type SpotifyTrack,
} from '../../../api/sources/spotify-collection';
import { StudioPanel } from '../../../components/StudioPanel';

type Mode = 'search' | 'mine' | 'artist';

const MODES = [
  { id: 'search', label: 'Search Spotify' },
  { id: 'mine', label: 'Your tracks' },
  { id: 'artist', label: 'By artist link' },
] as const;

function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function SpotifyImportPanel({
  collectionId,
  onAdded,
}: {
  collectionId: string;
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingUri, setAddingUri] = useState<string | null>(null);
  const [added, setAdded] = useState<ReadonlySet<string>>(new Set());

  const load = async (next: Mode, value: string) => {
    if (next !== 'mine' && !value.trim()) {
      return;
    }
    setBusy(true);
    const res =
      next === 'mine'
        ? await fetchMySpotifyTracks()
        : next === 'artist'
          ? await fetchSpotifyArtistTracks(value.trim())
          : await searchSpotify(value.trim());
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

  const add = async (track: SpotifyTrack) => {
    setAddingUri(track.uri);
    const res = await addSpotifyTrack(collectionId, track.uri);
    setAddingUri(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAdded((current) => new Set(current).add(track.uri));
    toast.success(`${track.title} added.`);
    onAdded();
  };

  return (
    <StudioPanel
      title="Add from Spotify"
      description="Tracks are embedded from Spotify; Tahti never copies the audio."
    >
      <div className="flex flex-col gap-3">
        <SegmentedControl
          aria-label="Spotify source"
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
                mode === 'artist' ? 'Spotify artist link' : 'Search Spotify'
              }
              placeholder={
                mode === 'artist'
                  ? 'https://open.spotify.com/artist/…'
                  : 'Search tracks…'
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
              ? 'No tracks found. Link your Spotify artist profile in Add-ons → Spotify first.'
              : 'No tracks found.'}
          </p>
        ) : (
          <ul aria-label="Spotify tracks" className="flex flex-col gap-2">
            {results.map((track) => (
              <li key={track.uri} className="flex items-center gap-3 text-sm">
                <MediaArtwork
                  size="thumb"
                  src={track.coverUrl ? spotifyCoverUrl(track.coverUrl) : null}
                  alt=""
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{track.title}</p>
                  <p className="text-foreground-secondary truncate text-xs">
                    {track.artists.join(', ')} ·{' '}
                    {formatDuration(track.durationSec)}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={addingUri === track.uri || added.has(track.uri)}
                  onClick={() => void add(track)}
                >
                  <PlusIcon size={15} aria-hidden className="mr-1" />
                  {added.has(track.uri)
                    ? 'Added'
                    : addingUri === track.uri
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
