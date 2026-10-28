import {
  CalendarClockIcon,
  ExternalLinkIcon,
  HistoryIcon,
  PencilIcon,
  PlusIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  Badge,
  Button,
  ButtonLink,
  MediaArtwork,
  Tabs,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  cancelListeningParty,
  fetchMyListeningParties,
  type ListeningPartyState,
  type ListeningPartySummaryDto,
} from '../../api/listening-parties';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PARTY_START_FORMAT } from '../../components/listening-party/format';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';

const STATE_BADGE: Record<
  ListeningPartyState,
  { label: string; color: 'green' | 'blue' | 'secondary' | 'red' }
> = {
  SCHEDULED: { label: 'Scheduled', color: 'blue' },
  LIVE: { label: 'Live', color: 'green' },
  ENDED: { label: 'Ended', color: 'secondary' },
  CANCELED: { label: 'Canceled', color: 'red' },
};

/** Studio → Listening parties: the artist's parties, with reschedule and
 * cancel while a party has not started. */
export function StudioListeningPartiesView() {
  const [parties, setParties] = useState<ListeningPartySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<ListeningPartySummaryDto | null>(null);

  const reload = () => {
    void fetchMyListeningParties().then(({ data, meta }) => {
      setParties(data);
      setError(meta.source === 'api' ? (meta.reason ?? null) : null);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const upcoming = parties
    .filter((party) => party.state === 'SCHEDULED' || party.state === 'LIVE')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = parties.filter(
    (party) => party.state === 'ENDED' || party.state === 'CANCELED',
  );

  const renderList = (items: ListeningPartySummaryDto[], empty: string) => {
    if (loading) {
      return <PageLoading label="Loading…" />;
    }
    if (error && parties.length === 0) {
      return (
        <PageError
          title="Could not load your listening parties"
          description={error}
          onRetry={reload}
        />
      );
    }
    if (items.length === 0) {
      return <PageEmpty title={empty} />;
    }
    return (
      <ul className="flex flex-col gap-2">
        {items.map((party) => {
          const badge = STATE_BADGE[party.state];
          return (
            <li
              key={party.id}
              className="border-border bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <MediaArtwork
                  src={party.release.artworkUrl ?? undefined}
                  alt=""
                  size="md"
                  className="rounded-md"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{party.release.title}</span>
                    <Badge variant="pill" color={badge.color}>
                      {badge.label}
                    </Badge>
                  </div>
                  <time
                    dateTime={party.startAt}
                    className="text-foreground-secondary text-xs"
                  >
                    {new Date(party.startAt).toLocaleString(
                      undefined,
                      PARTY_START_FORMAT,
                    )}
                  </time>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <ButtonLink
                  to="/party/$id"
                  params={{ id: party.id }}
                  size="sm"
                  variant="text"
                >
                  <ExternalLinkIcon size={14} aria-hidden className="mr-1.5" />
                  Open
                </ButtonLink>
                {party.state === 'SCHEDULED' ? (
                  <>
                    <ButtonLink
                      to="/studio/listening-parties/$partyId/edit"
                      params={{ partyId: party.id }}
                      size="sm"
                      variant="text"
                      aria-label={`Reschedule ${party.release.title}`}
                    >
                      <PencilIcon size={14} aria-hidden className="mr-1.5" />
                      Reschedule
                    </ButtonLink>
                    <Button
                      size="sm"
                      variant="text"
                      aria-label={`Cancel ${party.release.title}`}
                      onClick={() => setPendingCancel(party)}
                    >
                      <XCircleIcon size={14} aria-hidden className="mr-1.5" />
                      Cancel
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <StudioGate>
      <div className="studio-page-layout mx-auto flex max-w-3xl flex-col gap-6">
        <ViewShell
          title="Listening parties"
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content="Schedule listening party" side="top">
              <ButtonLink
                to="/studio/listening-parties/new"
                size="icon-sm"
                aria-label="Schedule listening party"
              >
                <PlusIcon size={16} aria-hidden />
              </ButtonLink>
            </Tooltip>
          }
        >
          <Tabs
            listClassName="border-border border-b pb-3"
            panelClassName="pt-2"
            items={[
              {
                id: 'upcoming',
                label: 'Upcoming',
                icon: <CalendarClockIcon size={14} />,
                content: (
                  <StudioPanel
                    title="Upcoming parties"
                    description="Fans hear the release once, start to finish, with you in the chat."
                  >
                    {renderList(upcoming, 'No listening parties scheduled')}
                  </StudioPanel>
                ),
              },
              {
                id: 'past',
                label: 'Past',
                icon: <HistoryIcon size={14} />,
                content: (
                  <StudioPanel title="Past parties">
                    {renderList(past, 'No past listening parties')}
                  </StudioPanel>
                ),
              },
            ]}
          />
        </ViewShell>
        <ConfirmDialog
          isOpen={pendingCancel !== null}
          title={
            pendingCancel
              ? `Cancel the ${pendingCancel.release.title} listening party?`
              : 'Cancel listening party?'
          }
          description="The party page tells visitors it was canceled. This cannot be undone."
          confirmLabel="Cancel party"
          onCancel={() => setPendingCancel(null)}
          onConfirm={() => {
            const party = pendingCancel;
            if (!party) {
              return;
            }
            setPendingCancel(null);
            void cancelListeningParty(party.id).then((result) => {
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success(
                `Canceled the ${party.release.title} listening party.`,
              );
              reload();
            });
          }}
        />
      </div>
    </StudioGate>
  );
}
