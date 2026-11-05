import {
  BellIcon,
  CalendarClockIcon,
  ExternalLinkIcon,
  HistoryIcon,
  PencilIcon,
  PlusIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
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
import { fetchPartyReminder } from '../../api/listening-party-reminders';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageEmpty, PageError, PageLoading } from '../../components/PageStates';
import { StudioGate } from '../../components/StudioGate';
import { StudioPanel } from '../../components/StudioPanel';
import { formatScheduleWindow } from '../../lib/scheduleTime';

export function StudioListeningPartiesView() {
  const { t } = useTranslation('web');
  const [parties, setParties] = useState<ListeningPartySummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] =
    useState<ListeningPartySummaryDto | null>(null);

  const stateBadge: Record<
    ListeningPartyState,
    { label: string; color: 'green' | 'blue' | 'secondary' | 'red' }
  > = {
    SCHEDULED: {
      label: t('studioListeningParties.stateScheduled'),
      color: 'blue',
    },
    LIVE: { label: t('studioListeningParties.stateLive'), color: 'green' },
    ENDED: {
      label: t('studioListeningParties.stateEnded'),
      color: 'secondary',
    },
    CANCELED: {
      label: t('studioListeningParties.stateCanceled'),
      color: 'red',
    },
  };

  const reload = () => {
    void fetchMyListeningParties().then(({ data, meta }) => {
      setParties(data);
      setError(meta.source === 'api' ? (meta.reason ?? null) : null);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  const [reminderCounts, setReminderCounts] = useState<Record<string, number>>(
    {},
  );
  const scheduledIds = parties
    .filter((party) => party.state === 'SCHEDULED')
    .map((party) => party.id)
    .join(',');
  useEffect(() => {
    if (!scheduledIds) {
      return;
    }
    let active = true;
    void Promise.all(
      scheduledIds.split(',').map(async (id) => {
        const { data } = await fetchPartyReminder(id);
        return [id, data?.count ?? 0] as const;
      }),
    ).then((entries) => {
      if (active) {
        setReminderCounts(Object.fromEntries(entries));
      }
    });
    return () => {
      active = false;
    };
  }, [scheduledIds]);

  const upcoming = parties
    .filter((party) => party.state === 'SCHEDULED' || party.state === 'LIVE')
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = parties.filter(
    (party) => party.state === 'ENDED' || party.state === 'CANCELED',
  );

  const renderList = (items: ListeningPartySummaryDto[], empty: string) => {
    if (loading) {
      return <PageLoading label={t('studioListeningParties.loading')} />;
    }
    if (error && parties.length === 0) {
      return (
        <PageError
          title={t('studioListeningParties.loadError')}
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
          const badge = stateBadge[party.state];
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
                    {formatScheduleWindow(party.startAt)}
                  </time>
                  {party.state === 'SCHEDULED' && reminderCounts[party.id] ? (
                    <span className="text-foreground-secondary ml-2 inline-flex items-center gap-1 text-xs">
                      <BellIcon size={12} aria-hidden />
                      {t('studioListeningParties.reminders', {
                        count: reminderCounts[party.id],
                      })}
                    </span>
                  ) : null}
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
                  {t('studioListeningParties.open')}
                </ButtonLink>
                {party.state === 'SCHEDULED' ? (
                  <>
                    <ButtonLink
                      to="/studio/listening-parties/$partyId/edit"
                      params={{ partyId: party.id }}
                      size="sm"
                      variant="text"
                      aria-label={t('studioListeningParties.rescheduleAria', {
                        title: party.release.title,
                      })}
                    >
                      <PencilIcon size={14} aria-hidden className="mr-1.5" />
                      {t('studioListeningParties.reschedule')}
                    </ButtonLink>
                    <Button
                      size="sm"
                      variant="text"
                      aria-label={t('studioListeningParties.cancelAria', {
                        title: party.release.title,
                      })}
                      onClick={() => setPendingCancel(party)}
                    >
                      <XCircleIcon size={14} aria-hidden className="mr-1.5" />
                      {t('studioListeningParties.cancel')}
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
          title={t('studioListeningParties.title')}
          classes={{ root: 'px-0 pt-0' }}
          actions={
            <Tooltip content={t('studioListeningParties.schedule')} side="top">
              <ButtonLink
                to="/studio/listening-parties/new"
                size="icon-sm"
                aria-label={t('studioListeningParties.schedule')}
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
                label: t('studioListeningParties.upcoming'),
                icon: <CalendarClockIcon size={14} />,
                content: (
                  <StudioPanel
                    title={t('studioListeningParties.upcomingTitle')}
                    description={t(
                      'studioListeningParties.upcomingDescription',
                    )}
                  >
                    {renderList(
                      upcoming,
                      t('studioListeningParties.emptyUpcoming'),
                    )}
                  </StudioPanel>
                ),
              },
              {
                id: 'past',
                label: t('studioListeningParties.past'),
                icon: <HistoryIcon size={14} />,
                content: (
                  <StudioPanel title={t('studioListeningParties.pastTitle')}>
                    {renderList(past, t('studioListeningParties.emptyPast'))}
                  </StudioPanel>
                ),
              },
            ]}
          />
        </ViewShell>
        <ConfirmDialog
          destructive
          isOpen={pendingCancel !== null}
          title={
            pendingCancel
              ? t('studioListeningParties.cancelTitle', {
                  title: pendingCancel.release.title,
                })
              : t('studioListeningParties.cancelTitleFallback')
          }
          description={t('studioListeningParties.cancelDescription')}
          confirmLabel={t('studioListeningParties.cancelConfirm')}
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
                t('toasts.partyCanceled', { title: party.release.title }),
              );
              reload();
            });
          }}
        />
      </div>
    </StudioGate>
  );
}
