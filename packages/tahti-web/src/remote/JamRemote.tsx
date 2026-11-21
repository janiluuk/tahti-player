import { useEffect, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { pickArtwork, type RepeatMode, type Track } from '@tahti-player/model';
import { CenteredLoader, TahtiJam } from '@tahti-player/ui';

import type { JamPlayback, JamQueue } from '../lib/jam/bridge';
import type { JamClient } from './jamClient';
import { useJamRemote, type JamRemoteState } from './useJamRemote';

type ConnectedState = JamRemoteState & {
  queue: JamQueue;
  playback: JamPlayback;
};

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = {
  off: 'all',
  all: 'one',
  one: 'off',
};

const SEARCH_DEBOUNCE_MS = 300;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; tracks: Track[] };

function useSearch(client: JamClient, query: string): SearchState {
  const [result, setResult] = useState<SearchState>({ status: 'idle' });
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResult({ status: 'idle' });
      return;
    }
    setResult({ status: 'loading' });
    let current = true;
    const timer = setTimeout(() => {
      client
        .search(trimmed)
        .then(({ tracks }) => current && setResult({ status: 'done', tracks }))
        .catch(() => current && setResult({ status: 'error' }));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [client, query]);
  return result;
}

function ignore(request: Promise<unknown>) {
  request.catch(() => undefined);
}

function SearchResults({
  search,
  onAdd,
}: {
  search: SearchState;
  onAdd: (track: Track) => void;
}) {
  const { t } = useTranslation('web');
  if (search.status === 'error') {
    return (
      <TahtiJam.SearchDrawer.Error
        labels={{
          title: t('jamRemoteBatch35.searchFailed'),
          description: t('jamRemoteBatch35.searchFailedHint'),
        }}
      />
    );
  }
  if (search.status !== 'done') {
    return <CenteredLoader />;
  }
  if (search.tracks.length === 0) {
    return (
      <TahtiJam.SearchDrawer.Empty
        labels={{
          title: t('jamRemoteBatch35.noResults'),
          description: t('jamRemoteBatch35.noResultsHint'),
        }}
      />
    );
  }
  return (
    <TahtiJam.SearchDrawer.Results>
      {search.tracks.map((track) => (
        <TahtiJam.SearchResultTrack
          key={track.source.id}
          track={track}
          onAdd={onAdd}
        />
      ))}
    </TahtiJam.SearchDrawer.Results>
  );
}

/** The Tahti Jam phone remote: what's playing, the transport, the queue and Tahti search. */
export function JamRemote({ client }: { client: JamClient | null }) {
  const { t } = useTranslation('web');
  const state = useJamRemote(client);
  const [query, setQuery] = useState('');

  if (!client || state.status === 'unpaired') {
    return (
      <TahtiJam>
        <TahtiJam.Error
          labels={{
            title: t('jamRemoteBatch35.unpairedTitle'),
            subtitle: t('jamRemoteBatch35.unpairedHint'),
          }}
        />
      </TahtiJam>
    );
  }
  if (state.status === 'failed') {
    return (
      <TahtiJam>
        <TahtiJam.Error
          labels={{
            title: t('jamRemoteBatch35.failedTitle'),
            subtitle: t('jamRemoteBatch35.failedHint'),
          }}
        />
      </TahtiJam>
    );
  }
  if (!state.queue || !state.playback) {
    return (
      <TahtiJam>
        <TahtiJam.Connecting
          labels={{
            title: t('jamRemoteBatch35.connectingTitle'),
            subtitle: t('jamRemoteBatch35.connectingHint'),
          }}
        />
      </TahtiJam>
    );
  }

  return (
    <RemoteView
      client={client}
      state={{ ...state, queue: state.queue, playback: state.playback }}
      query={query}
      setQuery={setQuery}
    />
  );
}

function RemoteView({
  client,
  state,
  query,
  setQuery,
}: {
  client: JamClient;
  state: ConnectedState;
  query: string;
  setQuery: (query: string) => void;
}) {
  const { t } = useTranslation('web');
  const search = useSearch(client, query);
  const { queue, playback, settings } = state;
  const current = queue.items[queue.currentIndex];
  const elapsed = playback.seek;
  const duration = playback.duration;
  const connection = state.status === 'unpaired' ? 'failed' : state.status;

  return (
    <TahtiJam>
      <TahtiJam.Header
        connectionStatus={connection}
        connectionStatusLabels={{
          connecting: t('jamRemoteBatch35.statusConnecting'),
          connected: t('jamRemoteBatch35.statusConnected'),
          reconnecting: t('jamRemoteBatch35.statusReconnecting'),
          failed: t('jamRemoteBatch35.statusDisconnected'),
        }}
      >
        <TahtiJam.SearchBar
          value={query}
          onChange={setQuery}
          labels={{
            placeholder: t('jamRemoteBatch35.searchTahti'),
            search: t('jamRemoteBatch35.searchTahti'),
            clear: t('actions.clearSearch'),
          }}
        />
      </TahtiJam.Header>
      <TahtiJam.Content>
        {current ? (
          <>
            <TahtiJam.NowPlaying
              title={current.track.title}
              artist={current.track.artists
                .map((artist) => artist.name)
                .join(', ')}
              coverUrl={pickArtwork(current.track.artwork, 'cover', 208)?.url}
              isLoading={playback.status === 'loading'}
            />
            <TahtiJam.Controls
              isPlaying={playback.status === 'playing'}
              isLoading={playback.status === 'loading'}
              shuffleActive={settings.shuffle}
              repeatMode={settings.repeat}
              progress={duration > 0 ? (elapsed / duration) * 100 : 0}
              elapsedSeconds={elapsed}
              remainingSeconds={Math.max(0, duration - elapsed)}
              onPlayPause={() => ignore(client.toggle())}
              onNext={() => ignore(client.next())}
              onPrevious={() => ignore(client.previous())}
              onSeek={(percent) =>
                ignore(client.seek((percent / 100) * duration))
              }
              onShuffleToggle={() => ignore(client.shuffle(!settings.shuffle))}
              onRepeatToggle={() =>
                ignore(client.repeat(NEXT_REPEAT[settings.repeat]))
              }
            />
          </>
        ) : null}
        <TahtiJam.Queue
          items={queue.items}
          currentItemId={current?.id}
          onRemove={(id) => ignore(client.remove(id))}
          labels={{
            upNext: t('radio.tabUpNext'),
            title: t('jamRemoteBatch35.queueEmpty'),
            subtitle: t('jamRemoteBatch35.queueEmptyHint'),
          }}
        />
        <TahtiJam.SearchDrawer
          open={query.trim().length > 0}
          onBackdropClick={() => setQuery('')}
        >
          <SearchResults
            search={search}
            onAdd={(track) => {
              ignore(client.add(track));
              setQuery('');
            }}
          />
        </TahtiJam.SearchDrawer>
      </TahtiJam.Content>
    </TahtiJam>
  );
}
