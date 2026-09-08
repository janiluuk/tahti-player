import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { Badge, SectionShell, ViewShell } from '@tahti-player/ui';

import { fetchGovernanceMeetings } from '../api/client';
import { parseMeetingAgenda } from '../api/governanceMocks';
import type { GovernanceMeeting } from '../api/types';
import { PageLoading } from '../components/PageStates';
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

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchGovernanceMeetings().then((result) => {
      const found = result.data.find((m) => m.id === id) ?? null;
      setMeeting(found);
      setNotFound(!found);
      setLoading(false);
    });
  }, [user, id]);

  const agenda = meeting ? parseMeetingAgenda(meeting.agenda) : [];

  return (
    <ViewShell
      title={meeting?.title ?? 'Meeting'}
      classes={{
        root: 'px-0 pt-0 mx-auto max-w-2xl',
        scrollableArea: 'gap-6',
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

      {user && !loading && notFound && (
        <p className="text-foreground-secondary text-sm">Meeting not found.</p>
      )}

      {user && !loading && meeting && (
        <>
          <SectionShell title="Overview">
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
                {meeting.remoteUrl && (
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
              </dd>
            </dl>
          </SectionShell>

          <SectionShell title="Quorum & attendance">
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
          </SectionShell>

          <SectionShell title="Agenda">
            {agenda.length === 0 ? (
              <p className="text-foreground-secondary text-sm">
                No agenda published yet.
              </p>
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
            )}
          </SectionShell>
        </>
      )}
    </ViewShell>
  );
}
