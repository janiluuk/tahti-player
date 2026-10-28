import { ViewShell } from '@tahti-player/ui';

import type { ListeningPartyDto } from '../api/listening-parties';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { useListeningParty } from '../hooks/useListeningParty';
import { useListeningPartyTimeline } from '../hooks/useListeningPartyTimeline';

const SHELL_CLASSES = { root: 'px-0 pt-0 mx-auto w-full max-w-6xl' };

function ListeningPartyPage({
  party,
  receivedAt,
}: {
  party: ListeningPartyDto;
  receivedAt: number;
}) {
  const clock = useListeningPartyTimeline(party, receivedAt);
  if (!clock) {
    return null;
  }
  return (
    <ViewShell
      title="Listening party"
      subtitle={`${party.release.title} · ${party.host.displayName}`}
      classes={SHELL_CLASSES}
    >
      <div
        className="flex flex-col gap-6"
        data-testid="listening-party"
        data-state={clock.state}
      />
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
