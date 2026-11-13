import { CalendarCheckIcon, ScrollTextIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Badge, ExternalLink, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMeetings } from '../api/client';
import { parseMeetingAgenda } from '../api/governanceMocks';
import type { GovernanceMeeting } from '../api/types';
import { GovernancePanel } from '../components/governance/GovernancePanel';
import { MeetingAgendaItems } from '../components/governance/MeetingAgendaItems';
import { MeetingConflicts } from '../components/governance/MeetingConflicts';
import { ListingDate } from '../components/ListingDate';
import { PageBackLink } from '../components/PageBackLink';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { meetingStateLabel, meetingTypeLabel } from '../lib/governanceLabels';
import { dateLocaleTag } from '../lib/locale';
import { isSafeHref } from '../lib/safeHref';
import { useAuthStore } from '../stores/authStore';

export function GovernanceMeetingDetailView({ id }: { id: string }) {
  const { t } = useTranslation('web');
  const user = useAuthStore((s) => s.user);
  const [meeting, setMeeting] = useState<GovernanceMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void fetchGovernanceMeetings()
      .then((result) => {
        if (cancelled) {
          return;
        }
        const reason =
          result.meta.source === 'api' ? (result.meta.reason ?? null) : null;
        const found = result.data.find((m) => m.id === id) ?? null;
        setLoadError(reason);
        setMeeting(found);
        setNotFound(!found && !reason);
      })
      .catch((err) => {
        if (!cancelled) {
          setMeeting(null);
          setNotFound(false);
          setLoadError(
            err instanceof Error
              ? err.message
              : t('governanceMeetingDetailViewLeftovers.couldNotLoadMeetings'),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, id, attempt]);

  const agenda = meeting ? parseMeetingAgenda(meeting.agenda) : [];

  return (
    <ViewShell
      title={meeting?.title ?? 'Meeting'}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-2xl',
        content: 'gap-6',
      }}
    >
      <PageBackLink to="/governance" label={t('meetingDetail.governance')} />

      {!user && (
        <p className="text-foreground-secondary text-sm">
          {t('meetingDetail.signInWithACooperative')}
        </p>
      )}

      {user && loading && <PageLoading label={t('loading.loadingMeeting')} />}

      {user && !loading && loadError && (
        <PageError
          title={t('loadErrors.couldNotLoadThisMeeting')}
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}

      {user && !loading && notFound && (
        <p className="text-foreground-secondary text-sm">
          {t('meetingDetail.meetingNotFound')}
        </p>
      )}

      {user && !loading && !loadError && meeting && (
        <>
          <GovernancePanel title={t('meetingDetail.overview')} icon={UsersIcon}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pill" color="secondary">
                {meetingTypeLabel(meeting.type, t)}
              </Badge>
              <Badge variant="pill" color="blue">
                {meetingStateLabel(meeting.state, t)}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">
                {t('meetingDetail.scheduled')}
              </dt>
              <dd>
                {meeting.scheduledAt
                  ? new Date(meeting.scheduledAt).toLocaleString(
                      dateLocaleTag(),
                    )
                  : i18n.t('web:batch57.notListed')}
              </dd>
              <dt className="text-foreground-secondary">
                {t('meetingDetail.location')}
              </dt>
              <dd>
                {meeting.location ?? i18n.t('web:batch57.notListed')}
                {meeting.remoteUrl && isSafeHref(meeting.remoteUrl) && (
                  <>
                    {' · '}
                    <ExternalLink
                      href={meeting.remoteUrl}
                      className="no-underline underline-offset-2 hover:underline"
                    >
                      {t('meetingDetail.joinRemotely')}
                    </ExternalLink>
                  </>
                )}
              </dd>
              <dt className="text-foreground-secondary">
                {t('meetingDetail.noticePublished')}
              </dt>
              <dd>
                {meeting.noticeAt ? (
                  <ListingDate value={meeting.noticeAt} />
                ) : (
                  'Not yet published'
                )}
              </dd>
              <dt className="text-foreground-secondary">
                {t('meetingDetail.minutes')}
              </dt>
              <dd>
                {meeting.minutesApprovedAt ? (
                  <>
                    {t('meetingDetail.approved')}{' '}
                    <ListingDate value={meeting.minutesApprovedAt} />
                  </>
                ) : meeting.minutesKey ? (
                  'Uploaded, pending approval'
                ) : (
                  'Not yet uploaded'
                )}
                {meeting.minutesUrl && isSafeHref(meeting.minutesUrl) && (
                  <>
                    {' · '}
                    <ExternalLink
                      href={meeting.minutesUrl}
                      className="no-underline underline-offset-2 hover:underline"
                    >
                      {t('meetingDetail.download')}
                    </ExternalLink>
                  </>
                )}
              </dd>
            </dl>
          </GovernancePanel>

          <GovernancePanel
            title={t('meetingDetail.quorumAttendance')}
            icon={CalendarCheckIcon}
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">
                {t('meetingDetail.quorum')}
              </dt>
              <dd>
                {meeting.quorumMet === null
                  ? 'Not yet determined'
                  : meeting.quorumMet
                    ? t('governanceMeetingDetailViewStates.met')
                    : t('governanceMeetingDetailViewStates.notMet')}
                {meeting.quorumRequired !== null &&
                  ` (${meeting.quorumRequired} required)`}
              </dd>
              <dt className="text-foreground-secondary">
                {t('meetingDetail.present')}
              </dt>
              <dd>
                {meeting.presentCount}
                {meeting.eligibleMemberCount !== null &&
                  ` of ${meeting.eligibleMemberCount} eligible`}
              </dd>
              <dt className="text-foreground-secondary">
                {t('meetingDetail.attendanceRecorded')}
              </dt>
              <dd>{meeting.attendanceCount}</dd>
            </dl>
          </GovernancePanel>

          <GovernancePanel
            title={t('meetingDetail.agenda')}
            icon={ScrollTextIcon}
          >
            <MeetingAgendaItems
              meetingId={meeting.id}
              fallback={
                agenda.length === 0 ? (
                  <PageEmpty title={t('empties.noAgenda')} />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {agenda.map((item) => (
                      <li key={item.title}>
                        <p className="text-sm font-semibold">{item.title}</p>
                        {item.description ? (
                          <p className="text-foreground-secondary mt-1 text-sm">
                            {item.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )
              }
            />
          </GovernancePanel>
          <MeetingConflicts meetingId={meeting.id} />
        </>
      )}
    </ViewShell>
  );
}
