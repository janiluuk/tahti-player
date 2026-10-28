import { useState } from 'react';

import { ViewShell } from '@tahti-player/ui';

import type { ListeningPartyDto } from '../api/listening-parties';
import { ListeningPartyChat } from '../components/listening-party/ListeningPartyChat';
import { ListeningPartyHero } from '../components/listening-party/ListeningPartyHero';
import { ListeningPartyJoinButton } from '../components/listening-party/ListeningPartyJoinButton';
import { ListeningPartyLinerNotes } from '../components/listening-party/ListeningPartyLinerNotes';
import { ListeningPartyTracklist } from '../components/listening-party/ListeningPartyTracklist';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useListeningParty } from '../hooks/useListeningParty';
import { useListeningPartyPlayback } from '../hooks/useListeningPartyPlayback';
import { useListeningPartyTimeline } from '../hooks/useListeningPartyTimeline';
import { safeCreditName } from '../lib/displayName';
import { partyPlayableId } from '../lib/listeningPartyPlayback';
import { usePlayerStore } from '../stores/playerStore';

const SHELL_CLASSES = { root: 'px-0 pt-0 mx-auto w-full max-w-6xl' };

function ListeningPartyPage({
  party,
  receivedAt,
}: {
  party: ListeningPartyDto;
  receivedAt: number;
}) {
  const clock = useListeningPartyTimeline(party, receivedAt);
  const [joined, setJoined] = useState(false);
  useListeningPartyPlayback(party, clock, joined, () => setJoined(false));
  if (!clock) {
    return null;
  }
  const hostName =
    safeCreditName(party.host.displayName, party.host.username) ??
    party.host.username;
  const leave = () => {
    setJoined(false);
    const player = usePlayerStore.getState();
    if (player.currentId?.startsWith(partyPlayableId(party.id, ''))) {
      player.setStatus('paused');
    }
  };
  return (
    <ViewShell
      title="Listening party"
      subtitle={`${party.release.title} · ${hostName}`}
      classes={SHELL_CLASSES}
    >
      <div
        className="flex flex-col gap-6"
        data-testid="listening-party"
        data-state={clock.state}
      >
        <ListeningPartyHero
          party={party}
          clock={clock}
          actions={
            <ListeningPartyJoinButton
              state={clock.state}
              joined={joined}
              onJoin={() => setJoined(true)}
              onLeave={leave}
            />
          }
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="flex min-w-0 flex-col gap-6">
            <ListeningPartyTracklist tracks={party.tracks} clock={clock} />
            <ListeningPartyLinerNotes party={party} />
          </div>
          <aside className="flex min-w-0 flex-col gap-6">
            {clock.state !== 'CANCELED' ? (
              <ListeningPartyChat
                channelSlug={party.channel.slug}
                channelName={party.channel.name}
              />
            ) : null}
          </aside>
        </div>
      </div>
    </ViewShell>
  );
}

/** `/party/:id`: a release played once, start to finish, at a set time. */
export function ListeningPartyView({ id }: { id: string }) {
  const { load, reload } = useListeningParty(id);

  if (load.status === 'ready') {
    return (
      <ListeningPartyPage party={load.party} receivedAt={load.receivedAt} />
    );
  }
  return (
    <ViewShell title="Listening party" classes={SHELL_CLASSES}>
      {load.status === 'loading' ? (
        <PageLoading label="Loading the listening party…" />
      ) : load.status === 'not-found' ? (
        <PageEmpty
          icon="alert"
          title="Listening party not found"
          description="The link may be wrong, or the artist removed the party."
        />
      ) : (
        <PageError
          title="Could not load this listening party"
          description={load.error}
          onRetry={reload}
        />
      )}
    </ViewShell>
  );
}
