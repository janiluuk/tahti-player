import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  Button,
  CopyButton,
  Input,
  Select,
  Toggle,
  Tooltip,
  ViewShell,
} from '@tahti-player/ui';

import {
  createAdminGovernanceDocument,
  createAdminGovernanceMeeting,
  fetchAdminAgmMotions,
  fetchAdminGovernanceDocuments,
  fetchAdminGovernanceMeetings,
  patchAdminGovernanceMeeting,
  type AdminMotion,
} from '../../api/admin';
import type { GovernanceDocument, GovernanceMeeting } from '../../api/types';
import { AdminGate } from '../../components/AdminGate';
import { AdminPageLayout } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPanel } from '../../components/StudioPanel';

const DEFAULT_AGENDA = [
  'Call to order',
  'Quorum check',
  'Adoption of agenda',
  'Review of previous minutes',
  'Board report',
  'Financial report',
  'Motions',
  'Election of board (if applicable)',
  'Any other business',
  'Close',
];

function AgendaBuilder() {
  const [items, setItems] = useState<string[]>(DEFAULT_AGENDA);
  const agendaText = items
    .filter(Boolean)
    .map((item, i) => `${i + 1}. ${item}`)
    .join('\n');

  return (
    <StudioPanel
      title="Agenda builder"
      action={
        <CopyButton
          text={agendaText}
          size="sm"
          variant="secondary"
          aria-label="Copy agenda"
        />
      }
    >
      <ol className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-foreground-secondary w-5 shrink-0 text-right text-xs">
              {i + 1}.
            </span>
            <Input
              value={item}
              onChange={(e) =>
                setItems((prev) =>
                  prev.map((it, idx) => (idx === i ? e.target.value : it)),
                )
              }
              className="h-8 flex-1 text-sm"
            />
            <div className="flex shrink-0 gap-0.5">
              <Tooltip content="Move up" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() =>
                    setItems((prev) => {
                      const next = [...prev];
                      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                      return next;
                    })
                  }
                >
                  ↑
                </Button>
              </Tooltip>
              <Tooltip content="Move down" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label="Move down"
                  disabled={i === items.length - 1}
                  onClick={() =>
                    setItems((prev) => {
                      const next = [...prev];
                      [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
                      return next;
                    })
                  }
                >
                  ↓
                </Button>
              </Tooltip>
              <Tooltip content="Remove item" side="top">
                <Button
                  size="icon-sm"
                  variant="text"
                  aria-label="Remove item"
                  onClick={() =>
                    setItems((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  ×
                </Button>
              </Tooltip>
            </div>
          </li>
        ))}
      </ol>
      <Tooltip content="Add agenda item" side="top">
        <Button
          size="icon-sm"
          variant="secondary"
          className="mt-3"
          onClick={() => setItems((prev) => [...prev, ''])}
          aria-label="Add agenda item"
        >
          <PlusIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
    </StudioPanel>
  );
}

function motionStateLabel(state: AdminMotion['state']): string {
  return state.charAt(0) + state.slice(1).toLowerCase();
}

export function AdminAgmView() {
  const [motions, setMotions] = useState<AdminMotion[]>([]);
  const [meetings, setMeetings] = useState<GovernanceMeeting[]>([]);
  const [documents, setDocuments] = useState<GovernanceDocument[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingType, setMeetingType] =
    useState<GovernanceMeeting['type']>('GENERAL');
  const [meetingSaving, setMeetingSaving] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentType, setDocumentType] =
    useState<GovernanceDocument['type']>('MINUTES');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentPublish, setDocumentPublish] = useState(true);
  const [documentSaving, setDocumentSaving] = useState(false);
  const [meetingStateSaving, setMeetingStateSaving] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetchAdminAgmMotions(),
      fetchAdminGovernanceMeetings(),
      fetchAdminGovernanceDocuments(),
    ]).then(([motionsResult, meetingsResult, documentsResult]) => {
      setMotions(motionsResult.data);
      setMeetings(meetingsResult.data);
      setDocuments(documentsResult.data);
      setLoading(false);
    });
  }, []);

  return (
    <AdminGate>
      <div className="admin-page-layout px-1 py-2">
        <AdminPageLayout current="/admin/agm">
          <div className="flex max-w-4xl flex-col gap-6">
            <ViewShell title="AGM" classes={{ root: 'px-0 pt-0' }}>
              <Link
                to="/admin/governance"
                className="text-foreground-secondary hover:text-foreground text-xs underline underline-offset-2"
              >
                Governance overview
              </Link>

              <AgendaBuilder />

              <StudioPanel title="Meeting records">
                <div className="border-border mb-4 grid gap-2 border-b pb-4 sm:grid-cols-[1fr_minmax(12rem,auto)_auto]">
                  <Input
                    value={meetingTitle}
                    onChange={(event) => setMeetingTitle(event.target.value)}
                    placeholder="Meeting title"
                    aria-label="Meeting title"
                  />
                  <Select
                    label="Meeting type"
                    value={meetingType}
                    onValueChange={(value) =>
                      setMeetingType(value as GovernanceMeeting['type'])
                    }
                    options={[
                      { id: 'GENERAL', label: 'General meeting' },
                      {
                        id: 'EXTRAORDINARY_GENERAL',
                        label: 'Extraordinary general',
                      },
                      { id: 'BOARD', label: 'Board meeting' },
                    ]}
                  />
                  <Button
                    size="sm"
                    disabled={meetingSaving || !meetingTitle.trim()}
                    onClick={() => {
                      setMeetingSaving(true);
                      void createAdminGovernanceMeeting({
                        title: meetingTitle.trim(),
                        type: meetingType,
                      }).then((result) => {
                        setMeetingSaving(false);
                        if (result.data) {
                          setMeetings((current) => [result.data!, ...current]);
                          setMeetingTitle('');
                        }
                      });
                    }}
                  >
                    {meetingSaving ? 'Creating…' : 'Create meeting'}
                  </Button>
                </div>
                {meetings.length === 0 ? (
                  <p className="text-foreground-secondary text-sm">
                    No persisted meeting records yet. Create the meeting record
                    before publishing notice or minutes.
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {meetings.map((meeting) => (
                      <li
                        key={meeting.id}
                        className="py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium">{meeting.title}</span>
                          <span className="text-foreground-secondary text-xs">
                            {meeting.state}
                          </span>
                        </div>
                        <p className="text-foreground-secondary mt-1 text-xs">
                          {meeting.scheduledAt
                            ? new Date(meeting.scheduledAt).toLocaleString()
                            : 'Date not scheduled'}{' '}
                          · {meeting.presentCount}/
                          {meeting.eligibleMemberCount ?? '—'} present
                        </p>
                        <div className="mt-2 flex max-w-xs items-center gap-2">
                          <Select
                            label="State"
                            value={meeting.state}
                            disabled={meetingStateSaving === meeting.id}
                            onValueChange={(value) => {
                              const state = value as GovernanceMeeting['state'];
                              setMeetingStateSaving(meeting.id);
                              void patchAdminGovernanceMeeting(meeting.id, {
                                state,
                              }).then((result) => {
                                setMeetingStateSaving(null);
                                if (result.data) {
                                  setMeetings((current) =>
                                    current.map((item) =>
                                      item.id === meeting.id
                                        ? result.data!
                                        : item,
                                    ),
                                  );
                                }
                              });
                            }}
                            options={[
                              { id: 'DRAFT', label: 'Draft' },
                              { id: 'SCHEDULED', label: 'Scheduled' },
                              { id: 'HELD', label: 'Held' },
                              { id: 'MINUTES_DRAFT', label: 'Minutes draft' },
                              { id: 'APPROVED', label: 'Approved' },
                              { id: 'CANCELLED', label: 'Cancelled' },
                            ]}
                          />
                          {meetingStateSaving === meeting.id && (
                            <span className="text-foreground-secondary text-xs">
                              Saving…
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </StudioPanel>

              <StudioPanel title="Motions & proposals">
                {loading ? (
                  <PageLoading label="Loading motions…" />
                ) : motions.length === 0 ? (
                  <p className="text-foreground-secondary py-4 text-center text-sm">
                    No open or draft motions.
                  </p>
                ) : (
                  <ul className="divide-border divide-y">
                    {motions.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{m.title}</div>
                          <div className="text-foreground-secondary text-xs">
                            {m.advisory ? 'Advisory' : 'Binding'} ·{' '}
                            {motionStateLabel(m.state)} · {m.totalVotes} votes
                          </div>
                        </div>
                        <div className="text-foreground-secondary text-xs">
                          Opens {new Date(m.openAt).toLocaleDateString('fi-FI')}{' '}
                          · Closes{' '}
                          {new Date(m.closeAt).toLocaleDateString('fi-FI')}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-foreground-secondary mt-3 text-xs">
                  All AGM decisions are advisory until bylaws authorise
                  asynchronous binding votes. Formal binding resolutions are
                  recorded as board resolutions.
                </p>
              </StudioPanel>

              <details className="border-border bg-background-secondary/40 rounded-xl border p-5 shadow-sm sm:p-6">
                <summary className="cursor-pointer text-sm font-medium">
                  Member notification requirements
                </summary>
                <div className="mt-3 flex flex-col gap-3 text-sm">
                  <p className="text-foreground-secondary text-xs">
                    Finnish association law (yhdistyslaki 24 §) requires written
                    notice to all members at least seven days before the AGM.
                    The notice must state the date, venue, and agenda.
                  </p>
                  <ul className="text-foreground-secondary list-disc space-y-1 pl-5 text-xs">
                    <li>Date, time, and venue (physical or remote link)</li>
                    <li>Agenda (use the builder above)</li>
                    <li>Any proposed bylaw changes in full</li>
                    <li>Deadline for member motions</li>
                    <li>Instructions for remote participation</li>
                  </ul>
                </div>
              </details>

              <StudioPanel title="Minutes & records">
                <p className="text-foreground-secondary text-sm">
                  Keep the meeting record connected to the board&apos;s formal
                  records and member register.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href="/tahti-api/api/admin/members/export.csv">
                    <Button size="sm" variant="secondary">
                      Export member register
                    </Button>
                  </a>
                  <a href="/admin/logs">
                    <Button size="sm" variant="secondary">
                      Open audit log
                    </Button>
                  </a>
                  <a href="/admin/governance">
                    <Button size="sm" variant="secondary">
                      Governance tools
                    </Button>
                  </a>
                </div>
                <div className="border-border mt-4 border-t pt-3">
                  <h3 className="text-sm font-semibold">Published documents</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_minmax(12rem,auto)]">
                    <Input
                      value={documentTitle}
                      onChange={(event) => setDocumentTitle(event.target.value)}
                      placeholder="Document title"
                      aria-label="Document title"
                    />
                    <Select
                      label="Document type"
                      value={documentType}
                      onValueChange={(value) =>
                        setDocumentType(value as GovernanceDocument['type'])
                      }
                      options={[
                        { id: 'MINUTES', label: 'Minutes' },
                        { id: 'MEETING_NOTICE', label: 'Meeting notice' },
                        { id: 'ANNUAL_REPORT', label: 'Annual report' },
                        { id: 'BYLAWS', label: 'Bylaws' },
                        { id: 'POLICY', label: 'Policy' },
                        {
                          id: 'FINANCIAL_STATEMENT',
                          label: 'Financial statement',
                        },
                        { id: 'AUDIT_REPORT', label: 'Audit report' },
                        { id: 'OTHER', label: 'Other' },
                      ]}
                    />
                    <Input
                      value={documentUrl}
                      onChange={(event) => setDocumentUrl(event.target.value)}
                      placeholder="Public document URL (optional)"
                      aria-label="Public document URL"
                    />
                    <Button
                      size="sm"
                      disabled={documentSaving || !documentTitle.trim()}
                      onClick={() => {
                        setDocumentSaving(true);
                        void createAdminGovernanceDocument({
                          title: documentTitle.trim(),
                          type: documentType,
                          externalUrl: documentUrl.trim() || undefined,
                          publishedAt: documentPublish
                            ? new Date().toISOString()
                            : null,
                        }).then((result) => {
                          setDocumentSaving(false);
                          if (result.data) {
                            setDocuments((current) => [
                              result.data!,
                              ...current,
                            ]);
                            setDocumentTitle('');
                            setDocumentUrl('');
                          }
                        });
                      }}
                    >
                      {documentSaving ? 'Publishing…' : 'Add document'}
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground-secondary text-xs">
                      Publish immediately to members
                    </span>
                    <Toggle
                      label="Publish immediately to members"
                      checked={documentPublish}
                      onChange={setDocumentPublish}
                    />
                  </div>
                  {documents.length === 0 ? (
                    <p className="text-foreground-secondary mt-1 text-xs">
                      No governance documents yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-xs">
                      {documents.map((document) => (
                        <li key={document.id}>
                          {document.downloadUrl || document.externalUrl ? (
                            <a
                              href={
                                document.downloadUrl ??
                                document.externalUrl ??
                                undefined
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="underline-offset-2 hover:underline"
                            >
                              {document.title}
                            </a>
                          ) : (
                            document.title
                          )}{' '}
                          · v{document.version} ·{' '}
                          {document.publishedAt ? 'Published' : 'Draft'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </StudioPanel>
            </ViewShell>
          </div>
        </AdminPageLayout>
      </div>
    </AdminGate>
  );
}
