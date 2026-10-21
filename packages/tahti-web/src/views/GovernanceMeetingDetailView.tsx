import { Link } from '@tanstack/react-router';
import { CalendarCheckIcon, ScrollTextIcon, UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMeetings } from '../api/client';
import { parseMeetingAgenda } from '../api/governanceMocks';
import type { GovernanceMeeting } from '../api/types';
import { GovernancePanel } from '../components/governance/GovernancePanel';
import { MeetingAgendaItems } from '../components/governance/MeetingAgendaItems';
import { MeetingConflicts } from '../components/governance/MeetingConflicts';
import { PageEmpty, PageError, PageLoading } from '../components/PageStates';
import { isSafeHref } from '../lib/safeHref';
import { useAuthStore } from '../stores/authStore';

const TYPE_LABEL: Record<GovernanceMeeting['type'], string> = {
  GENERAL: 'General meeting',
  EXTRAORDINARY_GENERAL: 'Extraordinary general meeting',
  BOARD: 'Board meeting',
};

export function GovernanceMeetingDetailView({ id }: { id: string }) {
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
            err instanceof Error ? err.message : 'Could not load meetings.',
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
      <Link
        to="/governance"
        className="text-foreground-secondary w-fit text-xs underline-offset-2 hover:underline"
      >
        ← Back to governance
      </Link>

      {!user && (
        <p className="text-foreground-secondary text-sm">
          Sign in with a cooperative membership account to view meeting records.
        </p>
      )}

      {user && loading && <PageLoading label="Loading meeting…" />}

      {user && !loading && loadError && (
        <PageError
          title="Could not load this meeting"
          description={loadError}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}

      {user && !loading && notFound && (
        <p className="text-foreground-secondary text-sm">Meeting not found.</p>
      )}

      {user && !loading && !loadError && meeting && (
        <>
          <GovernancePanel title="Overview" icon={UsersIcon}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="pill" color="secondary">
                {TYPE_LABEL[meeting.type]}
              </Badge>
              <Badge variant="pill" color="blue">
                {meeting.state}
              </Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">Scheduled</dt>
              <dd>
                {meeting.scheduledAt
                  ? new Date(meeting.scheduledAt).toLocaleString()
                  : 'Not listed'}
              </dd>
              <dt className="text-foreground-secondary">Location</dt>
              <dd>
                {meeting.location ?? 'Not listed'}
                {meeting.remoteUrl && isSafeHref(meeting.remoteUrl) && (
                  <>
                    {' · '}
                    <a
                      href={meeting.remoteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      Join remotely
                    </a>
                  </>
                )}
              </dd>
              <dt className="text-foreground-secondary">Notice published</dt>
              <dd>
                {meeting.noticeAt
                  ? new Date(meeting.noticeAt).toLocaleDateString()
                  : 'Not yet published'}
              </dd>
              <dt className="text-foreground-secondary">Minutes</dt>
              <dd>
                {meeting.minutesApprovedAt
                  ? `Approved ${new Date(meeting.minutesApprovedAt).toLocaleDateString()}`
                  : meeting.minutesKey
                    ? 'Uploaded, pending approval'
                    : 'Not yet uploaded'}
                {meeting.minutesUrl && isSafeHref(meeting.minutesUrl) && (
                  <>
                    {' · '}
                    <a
                      href={meeting.minutesUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      Download
                    </a>
                  </>
                )}
              </dd>
            </dl>
          </GovernancePanel>

          <GovernancePanel title="Quorum & attendance" icon={CalendarCheckIcon}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-foreground-secondary">Quorum</dt>
              <dd>
                {meeting.quorumMet === null
                  ? 'Not yet determined'
                  : meeting.quorumMet
                    ? 'Met'
                    : 'Not met'}
                {meeting.quorumRequired !== null &&
                  ` (${meeting.quorumRequired} required)`}
              </dd>
              <dt className="text-foreground-secondary">Present</dt>
              <dd>
                {meeting.presentCount}
                {meeting.eligibleMemberCount !== null &&
                  ` of ${meeting.eligibleMemberCount} eligible`}
              </dd>
              <dt className="text-foreground-secondary">Attendance recorded</dt>
              <dd>{meeting.attendanceCount}</dd>
            </dl>
          </GovernancePanel>

          <GovernancePanel title="Agenda" icon={ScrollTextIcon}>
            <MeetingAgendaItems
              meetingId={meeting.id}
              fallback={
                agenda.length === 0 ? (
                  <PageEmpty title="No agenda published yet." />
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
