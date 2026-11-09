import {
  CheckCircle2Icon,
  Clock3Icon,
  SendIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { i18n, useTranslation } from '@tahti-player/i18n';
import { Button, Dialog, Input, Toggle } from '@tahti-player/ui';

import {
  fetchMetaStreamPreference,
  fetchMyRadioSubmissions,
  fetchStudioSounds,
  patchMetaStreamPreference,
  submitTracksToRadioRotation,
  type RadioSubmission,
} from '../api/studio';
import type { StudioSound } from '../api/studio-types';
import { PageEmpty, PageError, PageLoading } from './PageStates';
import { StudioPanel } from './StudioPanel';

const MAX_TRACKS = 5;
const isSingleTrack = (item: StudioSound) =>
  item.status === 'READY' &&
  !item.embedProvider &&
  item.contentType !== 'DJ_SET' &&
  item.contentType !== 'CLIP';

export function StudioRadioSubmissionPanel() {
  const { t } = useTranslation('web');
  const [sounds, setSounds] = useState<StudioSound[]>([]);
  const [submissions, setSubmissions] = useState<RadioSubmission[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  const reload = () => {
    void Promise.all([
      fetchStudioSounds(),
      fetchMyRadioSubmissions(),
      fetchMetaStreamPreference(),
    ]).then(([soundResult, submissionResult, preference]) => {
      setSounds(soundResult.data);
      setSubmissions(submissionResult.data);
      setSubmissionsError(
        submissionResult.meta.source === 'api'
          ? (submissionResult.meta.reason ?? null)
          : null,
      );
      setOptedOut(preference.data.metaStreamOptOut);
      setLoading(false);
    });
  };
  useEffect(reload, []);

  const candidates = useMemo(() => sounds.filter(isSingleTrack), [sounds]);
  const submitted = useMemo(
    () => new Map(submissions.map((item) => [item.sound.id, item])),
    [submissions],
  );

  const submit = async () => {
    setBusy(true);
    const result = await submitTracksToRadioRotation(selected, note);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(i18n.t('web:toasts.radioTracksSubmitted'));
    setSelected([]);
    setNote('');
    setOpen(false);
    reload();
  };

  const toggleOptOut = async () => {
    const next = !optedOut;
    setOptedOut(next);
    const result = await patchMetaStreamPreference(next);
    if (!result.ok) {
      setOptedOut(!next);
      toast.error(result.error);
    }
  };

  return (
    <>
      <StudioPanel
        title={t('studioRadioSubmissionPanel.tahtiRadio')}
        description={t('studioRadioSubmissionPanel.submitUpToFiveSingle')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Toggle
            label={t('studioRadioSubmissionPanel.includeMyChannelInTahti')}
            showLabel
            checked={!optedOut}
            onChange={() => void toggleOptOut()}
          />
          <Button className="gap-1.5" onClick={() => setOpen(true)}>
            <SendIcon size={16} aria-hidden />
            {t('studioRadioSubmissionPanel.selectTracks')}
          </Button>
        </div>
      </StudioPanel>
      <StudioPanel
        title={t('studioRadioSubmissionPanel.submissionStatus')}
        description={t('studioRadioSubmissionPanel.trackReviewDecisionsAndAny')}
      >
        {loading ? (
          <PageLoading label={t('loading.loadingSubmissions')} />
        ) : submissionsError && submissions.length === 0 ? (
          <PageError
            title={t('loadErrors.couldNotLoadYourSubmissions')}
            description={submissionsError}
            onRetry={() => {
              setLoading(true);
              reload();
            }}
          />
        ) : submissions.length === 0 ? (
          <PageEmpty
            title={t('empties.noRadioSubmissions')}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setOpen(true)}
              >
                <SendIcon size={16} aria-hidden />
                {t('emptyActions.submitToRadio')}
              </Button>
            }
          />
        ) : (
          <ul className="border-border divide-border divide-y rounded-lg border">
            {submissions.map((submission) => (
              <li key={submission.id} className="flex items-start gap-3 p-3">
                <StatusIcon status={submission.status} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {submission.sound.title}
                  </p>
                  <p className="text-foreground-secondary text-xs">
                    {statusLabel(submission.status)}
                    {submission.rejectionNote
                      ? ` · ${submission.rejectionNote}`
                      : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioPanel>
      <Dialog.Root isOpen={open} onClose={() => setOpen(false)}>
        <Dialog.Title>
          {t('studioRadioSubmissionPanel.submitTracksToTahtiRadio')}
        </Dialog.Title>
        <Dialog.Description>
          Select up to {MAX_TRACKS} single audio files from your library.
        </Dialog.Description>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {candidates.map((item) => {
              const existing = submitted.get(item.id);
              const checked = selected.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="border-border flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="min-w-0 flex-1 text-sm">{item.title}</span>
                  <span className="text-foreground-secondary text-xs">
                    {existing ? statusLabel(existing.status) : 'Ready'}
                  </span>
                  <Toggle
                    label={t('studioRadioSubmissionPanelLabels.selectTitle', {
                      title: item.title,
                    })}
                    checked={checked}
                    disabled={
                      Boolean(existing) ||
                      (!checked && selected.length >= MAX_TRACKS)
                    }
                    onChange={(next) =>
                      setSelected((current) =>
                        next
                          ? [...current, item.id]
                          : current.filter((id) => id !== item.id),
                      )
                    }
                  />
                </div>
              );
            })}
          </div>
          <Input
            label={t('studioRadioSubmissionPanel.noteOptional')}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t(
              'studioRadioSubmissionPanel.tellTheReviewersAboutThis',
            )}
          />
          <Dialog.Actions>
            <Dialog.Close>
              {t('studioRadioSubmissionPanel.cancel')}
            </Dialog.Close>
            <Button disabled={busy || selected.length === 0} type="submit">
              Submit {selected.length || ''}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </>
  );
}

const statusLabel = (status: RadioSubmission['status']) =>
  status === 'APPROVED'
    ? 'In rotation'
    : status === 'REJECTED'
      ? 'Rejected'
      : 'Pending review';
const StatusIcon = ({ status }: { status: RadioSubmission['status'] }) =>
  status === 'APPROVED' ? (
    <CheckCircle2Icon
      className="text-accent-green-strong"
      size={18}
      aria-hidden
    />
  ) : status === 'REJECTED' ? (
    <XCircleIcon className="text-accent-red-strong" size={18} aria-hidden />
  ) : (
    <Clock3Icon className="text-accent-yellow-strong" size={18} aria-hidden />
  );
