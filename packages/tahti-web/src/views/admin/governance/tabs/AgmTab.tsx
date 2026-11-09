import { PlusIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Badge,
  Button,
  ButtonAnchor,
  EditIconButton,
  ExternalLink,
  HiddenFileInput,
  InlineError,
  InlineLoader,
  Input,
  Loader,
  Select,
  Toggle,
} from '@tahti-player/ui';

import {
  createAdminGovernanceDocument,
  createAdminGovernanceMeeting,
  fetchAdminAgmMotions,
  fetchAdminGovernanceAttendance,
  fetchAdminGovernanceDocuments,
  fetchAdminGovernanceMeetings,
  patchAdminGovernanceMeeting,
  uploadAdminGovernanceMinutes,
  upsertAdminGovernanceAttendance,
  type AdminMotion,
} from '../../../../api/admin';
import type {
  GovernanceAttendanceItem,
  GovernanceAttendanceStatus,
  GovernanceDocument,
  GovernanceMeeting,
} from '../../../../api/types';
import { PageEmpty } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { numericDay } from '../../../../lib/relativeDate';
import { isSafeHref } from '../../../../lib/safeHref';
import { formatScheduleWindow } from '../../../../lib/scheduleTime';
import { GovernanceDocumentRow } from '../records/GovernanceDocumentRow';
import { LegalHoldControl } from '../records/LegalHoldControl';
import { MemberRegisterPanel } from '../records/MemberRegisterPanel';
import { AgendaBuilder } from './AgendaBuilder';
import { AgendaItemsPanel } from './AgendaItemsPanel';
import {
  CollapsibleRecord,
  ConflictsPanel,
  NoticeDeliveriesPanel,
} from './MeetingRecordPanels';

function motionStateLabel(state: AdminMotion['state']): string {
  return state.charAt(0) + state.slice(1).toLowerCase();
}

const ATTENDANCE_BADGE_COLOR: Record<
  GovernanceAttendanceStatus,
  'green' | 'red' | 'secondary'
> = {
  PRESENT: 'green',
  ABSENT: 'red',
  EXCUSED: 'secondary',
};

/** Roll-call by name — see upsertAdminGovernanceAttendance: the backend
 * only upserts by memberId, which this admin UI has no clean way to
 * resolve from the member list, so entries are recorded by display name
 * and are add-only (re-submitting a name adds another row rather than
 * editing the existing one). */
function AttendancePanel({ meeting }: { meeting: GovernanceMeeting }) {
  const { t } = useTranslation('web');
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<GovernanceAttendanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<GovernanceAttendanceStatus>('PRESENT');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLoading(true);
    void fetchAdminGovernanceAttendance(meeting.id).then((result) => {
      setRecords(result.data);
      setLoading(false);
    });
  }, [open, meeting.id]);

  return (
    <CollapsibleRecord
      label={t('agmTabLabels.attendanceAttendancecountRecorded', {
        attendanceCount: meeting.attendanceCount,
      })}
      open={open}
      onToggle={() => setOpen((prev) => !prev)}
    >
      {loading ? (
        <InlineLoader label={t('agmTab.loading')} textSize="xs" />
      ) : records.length === 0 ? (
        <PageEmpty title={t('empties.noAttendanceRecordedYet')} />
      ) : (
        <ul className="divide-border mb-3 divide-y text-sm">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between gap-2 py-1.5"
            >
              <span>{record.displayName}</span>
              <Badge
                variant="pill"
                color={ATTENDANCE_BADGE_COLOR[record.status]}
              >
                {record.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setSaving(true);
          void upsertAdminGovernanceAttendance(meeting.id, {
            displayName: name.trim(),
            status,
          }).then((result) => {
            setSaving(false);
            if (result.data) {
              setRecords((current) => [...current, result.data!]);
              setName('');
            }
          });
        }}
      >
        <Input
          autoComplete="off"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('agmTab.memberName')}
          aria-label={t('agmTab.memberName')}
          className="min-w-[160px] flex-1"
        />
        <Select
          label={t('agmTab.status')}
          value={status}
          onValueChange={(value) =>
            setStatus(value as GovernanceAttendanceStatus)
          }
          options={[
            { id: 'PRESENT', label: t('agmTabMore.present') },
            { id: 'ABSENT', label: t('agmTabMore.absent') },
            { id: 'EXCUSED', label: t('agmTabMore.excused') },
          ]}
        />
        <Button size="sm" disabled={saving || !name.trim()} type="submit">
          {saving ? t('agmTabStates.recording') : t('agmTabStates.record')}
        </Button>
      </form>
    </CollapsibleRecord>
  );
}

function MinutesUploadButton({
  label,
  disabled,
  onFile,
}: {
  label: string;
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        size="xs"
        variant="text"
        className="text-primary-strong"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {label}
      </Button>
      <HiddenFileInput
        ref={inputRef}
        accept="application/pdf"
        disabled={disabled}
        onFiles={([file]) => {
          if (file) {
            onFile(file);
          }
        }}
      />
    </>
  );
}

export function AgmTab() {
  const { t } = useTranslation('web');
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
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [minutesUploading, setMinutesUploading] = useState<string | null>(null);
  const [minutesError, setMinutesError] = useState<{
    meetingId: string;
    message: string;
  } | null>(null);
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
    <>
      <AgendaBuilder />

      <StudioPanel title={t('agmTab.meetingRecords')}>
        <form
          className="border-border mb-4 grid gap-2 border-b pb-4 sm:grid-cols-[1fr_minmax(12rem,auto)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
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
          <Input
            value={meetingTitle}
            onChange={(event) => setMeetingTitle(event.target.value)}
            placeholder={t('agmTab.meetingTitle')}
            aria-label={t('agmTab.meetingTitle')}
          />
          <Select
            label={t('agmTab.meetingType')}
            value={meetingType}
            onValueChange={(value) =>
              setMeetingType(value as GovernanceMeeting['type'])
            }
            options={[
              { id: 'GENERAL', label: t('agmTabMore.generalMeeting') },
              {
                id: 'EXTRAORDINARY_GENERAL',
                label: t('agmTabMore.extraordinaryGeneral'),
              },
              { id: 'BOARD', label: t('agmTabMore.boardMeeting') },
            ]}
          />
          <Button
            size="sm"
            disabled={meetingSaving || !meetingTitle.trim()}
            type="submit"
          >
            {meetingSaving ? (
              <Loader size="inline" shape="circle" className="mr-1.5" />
            ) : (
              <PlusIcon size={14} aria-hidden className="mr-1.5" />
            )}
            {meetingSaving
              ? t('agmTabStates.creating')
              : t('agmTabStates.createMeeting')}
          </Button>
        </form>
        {meetings.length === 0 ? (
          <PageEmpty title={t('empties.noPersistedMeetingRecordsYetCreate')} />
        ) : (
          <ul className="divide-border divide-y">
            {meetings.map((meeting) => (
              <li
                key={meeting.id}
                className="py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{meeting.title}</span>
                  <span className="text-foreground-secondary flex items-center gap-1 text-xs">
                    {meeting.state}
                    <EditIconButton
                      label={t('agmTabLabels.editStateOfTitle', {
                        title: meeting.title,
                      })}
                      editing={editingMeetingId === meeting.id}
                      variant={
                        editingMeetingId === meeting.id ? undefined : 'text'
                      }
                      onClick={() =>
                        setEditingMeetingId((current) =>
                          current === meeting.id ? null : meeting.id,
                        )
                      }
                    />
                  </span>
                </div>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {meeting.scheduledAt
                    ? formatScheduleWindow(meeting.scheduledAt)
                    : 'Date not scheduled'}{' '}
                  · {meeting.presentCount}/{meeting.eligibleMemberCount ?? '—'}{' '}
                  present
                </p>
                {editingMeetingId === meeting.id ? (
                  <div className="mt-2 flex max-w-xs items-center gap-2">
                    <Select
                      label={t('agmTab.state')}
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
                            setEditingMeetingId(null);
                            setMeetings((current) =>
                              current.map((item) =>
                                item.id === meeting.id ? result.data! : item,
                              ),
                            );
                          }
                        });
                      }}
                      options={[
                        { id: 'DRAFT', label: t('agmTabMore.draft') },
                        { id: 'SCHEDULED', label: t('agmTabMore.scheduled') },
                        { id: 'HELD', label: t('agmTabMore.held') },
                        {
                          id: 'MINUTES_DRAFT',
                          label: t('agmTabMore.minutesDraft'),
                        },
                        { id: 'APPROVED', label: t('agmTabMore.approved') },
                        { id: 'CANCELLED', label: t('agmTabMore.cancelled') },
                      ]}
                    />
                    {meetingStateSaving === meeting.id && (
                      <span className="text-foreground-secondary text-xs">
                        {t('agmTab.saving')}
                      </span>
                    )}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-foreground-secondary">
                    Minutes:{' '}
                    {meeting.minutesApprovedAt
                      ? 'Approved'
                      : meeting.minutesKey
                        ? t('agmTabStates.uploadedPendingApproval')
                        : t('agmTabStates.notUploaded')}
                  </span>
                  {meeting.minutesUrl && isSafeHref(meeting.minutesUrl) && (
                    <ExternalLink
                      href={meeting.minutesUrl}
                      className="no-underline underline-offset-2 hover:underline"
                    >
                      {t('agmTab.download')}
                    </ExternalLink>
                  )}
                  <MinutesUploadButton
                    label={
                      minutesUploading === meeting.id
                        ? 'Uploading…'
                        : meeting.minutesKey
                          ? t('agmTabStates.replaceFile')
                          : t('agmTabStates.uploadFile')
                    }
                    disabled={minutesUploading === meeting.id}
                    onFile={(file) => {
                      setMinutesUploading(meeting.id);
                      setMinutesError(null);
                      void uploadAdminGovernanceMinutes(meeting.id, file).then(
                        (result) => {
                          setMinutesUploading(null);
                          if (!result.ok) {
                            setMinutesError({
                              meetingId: meeting.id,
                              message: result.error,
                            });
                            return;
                          }
                          setMeetings((current) =>
                            current.map((item) =>
                              item.id === meeting.id ? result.data : item,
                            ),
                          );
                        },
                      );
                    }}
                  />
                  {!meeting.minutesApprovedAt && meeting.minutesKey && (
                    <Button
                      size="sm"
                      variant="text"
                      disabled={meetingStateSaving === meeting.id}
                      onClick={() => {
                        setMeetingStateSaving(meeting.id);
                        void patchAdminGovernanceMeeting(meeting.id, {
                          minutesApprovedAt: new Date().toISOString(),
                        }).then((result) => {
                          setMeetingStateSaving(null);
                          if (result.data) {
                            setMeetings((current) =>
                              current.map((item) =>
                                item.id === meeting.id ? result.data! : item,
                              ),
                            );
                          }
                        });
                      }}
                    >
                      {t('agmTab.approveMinutes')}
                    </Button>
                  )}
                </div>
                {minutesError?.meetingId === meeting.id && (
                  <InlineError textSize="xs" className="mt-1">
                    {minutesError.message}
                  </InlineError>
                )}
                <AgendaItemsPanel meetingId={meeting.id} />
                <AttendancePanel meeting={meeting} />
                <ConflictsPanel meetingId={meeting.id} />
                <NoticeDeliveriesPanel meetingId={meeting.id} />
                <LegalHoldControl
                  kind="meeting"
                  id={meeting.id}
                  title={meeting.title}
                  legalHoldAt={meeting.legalHoldAt}
                  legalHoldReason={meeting.legalHoldReason}
                />
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>

      <StudioPanel title={t('agmTab.motionsProposals')}>
        {loading ? (
          <InlineLoader
            label={t('agmTab.loadingMotions')}
            className="justify-center py-4"
          />
        ) : motions.length === 0 ? (
          <PageEmpty title={t('empties.noOpenOrDraftMotions')} />
        ) : (
          <ul className="divide-border divide-y">
            {motions.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <div className="font-medium">{m.title}</div>
                  <div className="text-foreground-secondary text-xs">
                    {m.advisory
                      ? t('agmTabStates.advisory')
                      : t('agmTabStates.binding')}{' '}
                    · {motionStateLabel(m.state)} · {m.totalVotes} votes
                  </div>
                </div>
                <div className="text-foreground-secondary text-xs">
                  Opens {numericDay(m.openAt)} · Closes {numericDay(m.closeAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-foreground-secondary mt-3 text-xs">
          {t('agmTab.allAgmDecisionsAreAdvisory')}
        </p>
      </StudioPanel>

      <details className="border-border bg-background-secondary/40 rounded-xl border p-5 shadow-sm sm:p-6">
        <summary className="cursor-pointer text-sm font-medium">
          {t('agmTab.memberNotificationRequirements')}
        </summary>
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <p className="text-foreground-secondary text-xs">
            Finnish association law (yhdistyslaki 24 §) requires written notice
            to all members at least seven days before the AGM. The notice must
            state the date, venue, and agenda.
          </p>
          <ul className="text-foreground-secondary list-disc space-y-1 pl-5 text-xs">
            <li>{t('agmTab.dateTimeAndVenuePhysical')}</li>
            <li>{t('agmTab.agendaUseTheBuilderAbove')}</li>
            <li>{t('agmTab.anyProposedBylawChangesIn')}</li>
            <li>{t('agmTab.deadlineForMemberMotions')}</li>
            <li>{t('agmTab.instructionsForRemoteParticipation')}</li>
          </ul>
        </div>
      </details>

      <StudioPanel title={t('agmTab.minutesRecords')}>
        <p className="text-foreground-secondary text-sm">
          {t('agmTab.keepTheMeetingRecordConnected')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ButtonAnchor
            href="/tahti-api/api/admin/members/export.csv"
            size="sm"
            variant="secondary"
          >
            {t('agmTab.exportMemberRegister')}
          </ButtonAnchor>
          <ButtonAnchor href="/admin/logs" size="sm" variant="secondary">
            {t('agmTab.openAuditLog')}
          </ButtonAnchor>
        </div>
        <MemberRegisterPanel />
        <div className="border-border mt-4 border-t pt-3">
          <h3 className="text-sm font-semibold">
            {t('agmTab.publishedDocuments')}
          </h3>
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[1fr_minmax(12rem,auto)]"
            onSubmit={(event) => {
              event.preventDefault();
              setDocumentSaving(true);
              void createAdminGovernanceDocument({
                title: documentTitle.trim(),
                type: documentType,
                externalUrl: documentUrl.trim() || undefined,
                publishedAt: documentPublish ? new Date().toISOString() : null,
              }).then((result) => {
                setDocumentSaving(false);
                if (result.data) {
                  setDocuments((current) => [result.data!, ...current]);
                  setDocumentTitle('');
                  setDocumentUrl('');
                }
              });
            }}
          >
            <Input
              value={documentTitle}
              onChange={(event) => setDocumentTitle(event.target.value)}
              placeholder={t('agmTab.documentTitle')}
              aria-label={t('agmTab.documentTitle')}
            />
            <Select
              label={t('agmTab.documentType')}
              value={documentType}
              onValueChange={(value) =>
                setDocumentType(value as GovernanceDocument['type'])
              }
              options={[
                { id: 'MINUTES', label: t('agmTabMore.minutes') },
                { id: 'MEETING_NOTICE', label: t('agmTabMore.meetingNotice') },
                { id: 'ANNUAL_REPORT', label: t('agmTabMore.annualReport') },
                { id: 'BYLAWS', label: t('agmTabMore.bylaws') },
                { id: 'POLICY', label: t('agmTabMore.policy') },
                {
                  id: 'FINANCIAL_STATEMENT',
                  label: t('agmTabMore.financialStatement'),
                },
                { id: 'AUDIT_REPORT', label: t('agmTabMore.auditReport') },
                { id: 'OTHER', label: t('agmTabMore.other') },
              ]}
            />
            <Input
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={documentUrl}
              onChange={(event) => setDocumentUrl(event.target.value)}
              placeholder={t('agmTab.publicDocumentUrlOptional')}
              aria-label={t('agmTab.publicDocumentUrl')}
            />
            <Button
              size="sm"
              disabled={documentSaving || !documentTitle.trim()}
              type="submit"
            >
              {documentSaving ? (
                <Loader size="inline" shape="circle" className="mr-1.5" />
              ) : (
                <PlusIcon size={14} aria-hidden className="mr-1.5" />
              )}
              {documentSaving
                ? t('agmTabStates.publishing')
                : t('agmTabStates.addDocument')}
            </Button>
          </form>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground-secondary text-xs">
              {t('agmTab.publishImmediatelyToMembers')}
            </span>
            <Toggle
              label={t('agmTab.publishImmediatelyToMembers')}
              checked={documentPublish}
              onChange={setDocumentPublish}
            />
          </div>
          {documents.length === 0 ? (
            <PageEmpty title={t('empties.noGovernanceDocumentsYet')} />
          ) : (
            <ul className="mt-2 space-y-1 text-xs">
              {documents.map((document) => (
                <GovernanceDocumentRow
                  key={document.id}
                  document={document}
                  onChanged={(next) =>
                    setDocuments((current) =>
                      current.map((item) =>
                        item.id === next.id ? next : item,
                      ),
                    )
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </StudioPanel>
    </>
  );
}
