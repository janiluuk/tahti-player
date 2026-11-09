import { CheckCircle2Icon, PlayIcon, XCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Badge, Button, ImageReveal, Textarea } from '@tahti-player/ui';

import {
  approveRadioSubmission,
  fetchAdminRadioSubmissionAudio,
  fetchAdminRadioSubmissions,
  rejectRadioSubmission,
  type AdminRadioSubmission,
  type AdminRadioSubmissionStatus,
} from '../../../../api/admin';
import { ListingDate } from '../../../../components/ListingDate';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
import { apiResult, useSnapshotFetch } from '../../../../lib/useSnapshotFetch';
import { usePlayerStore } from '../../../../stores/playerStore';

function statusBadge(status: AdminRadioSubmissionStatus): {
  label: string;
  color: 'green' | 'red' | 'orange';
} {
  if (status === 'APPROVED') {
    return { label: 'Approved', color: 'green' };
  }
  if (status === 'REJECTED') {
    return { label: 'Rejected', color: 'red' };
  }
  return { label: 'Pending', color: 'orange' };
}

function fmtDuration(sec: number | null): string {
  if (sec == null) {
    return '—';
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Radio submissions tab — ported as-is from the standalone admin route
 * (see AdminModerationView). Audits tracks submitted for Tahti Radio. */
export function RadioSubmissionsTab() {
  const { t } = useTranslation('web');
  const play = usePlayerStore((s) => s.play);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const snapshot = useSnapshotFetch<AdminRadioSubmission[]>(
    'admin-radio-submissions',
    async () => apiResult(await fetchAdminRadioSubmissions()),
  );
  const items = snapshot.data ?? [];
  const { loading, error: loadError, retry: reload } = snapshot;
  const setItems = (
    update: (current: AdminRadioSubmission[]) => AdminRadioSubmission[],
  ) => snapshot.mutate((current) => update(current ?? []));

  const active = items.find((i) => i.id === activeId) ?? items[0] ?? null;

  const markDecided = (
    row: AdminRadioSubmission,
    status: AdminRadioSubmissionStatus,
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === row.id ? { ...item, status } : item)),
    );
    toast.success(
      status === 'APPROVED'
        ? `${row.sound.title} is approved for Tahti Radio.`
        : `${row.sound.title} was rejected.`,
    );
  };

  const playActive = async (row: AdminRadioSubmission) => {
    setBusyId(row.id);
    setMsg(null);
    const result = await fetchAdminRadioSubmissionAudio(row.id);
    setBusyId(null);
    if (!result.ok) {
      setMsg(result.error);
      return;
    }
    play({
      id: `radio-sub:${result.data.soundId}`,
      kind: 'sound',
      title: result.data.title,
      artist: result.data.artistName,
      coverUrl: row.sound.bannerUrl ?? undefined,
      streamUrl: result.data.audioUrl,
      protocol: 'https',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        {t('radioSubmissionsTab.auditTracksSubmittedForTahti')}
      </p>

      {msg && (
        <p className="text-foreground-secondary text-sm" role="status">
          {msg}
        </p>
      )}

      {loading ? (
        <StudioPanel>
          <PageLoading label={t('loading.loadingRadioSubmissions')} />
        </StudioPanel>
      ) : loadError && items.length === 0 ? (
        <StudioPanel>
          <PageError
            title={t('loadErrors.couldNotLoadRadioSubmissions')}
            description={loadError}
            onRetry={reload}
          />
        </StudioPanel>
      ) : items.length === 0 ? (
        <StudioPanel>
          <PageEmpty title={t('empties.noUnauditedRadioSubmissions')} />
        </StudioPanel>
      ) : (
        <>
          {active && (
            <StudioPanel title={t('radioSubmissionsTab.auditing')}>
              <div className="flex items-start gap-4">
                <div className="bg-surface-secondary flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold">
                  <ImageReveal
                    src={active.sound.bannerUrl ?? undefined}
                    alt=""
                    className="size-full"
                    placeholder={
                      <span>
                        {active.sound.title.slice(0, 2).toUpperCase()}
                      </span>
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold">{active.sound.title}</h3>
                  <p className="text-foreground-secondary text-sm">
                    {active.sound.artistName ??
                      active.submitter?.displayName ??
                      'Unknown artist'}{' '}
                    · {fmtDuration(active.sound.durationSec)}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    disabled={busyId === active.id}
                    onClick={() => void playActive(active)}
                  >
                    <PlayIcon size={16} aria-hidden className="mr-1.5" />
                    {busyId === active.id
                      ? t('radioSubmissionsTabStates.loading')
                      : t('radioSubmissionsTabStates.play')}
                  </Button>
                </div>
              </div>

              <form
                className="mt-4 flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setBusyId(active.id);
                  const row = active;
                  void approveRadioSubmission(row.id).then((r) => {
                    setBusyId(null);
                    if (!r.ok) {
                      setMsg(r.error);
                    } else {
                      markDecided(row, 'APPROVED');
                    }
                  });
                }}
              >
                <Textarea
                  label={t('radioSubmissionsTab.noteToTheArtistOptional')}
                  tone="secondary"
                  value={notes[active.id] ?? ''}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [active.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  submitOnModEnter
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    className="gap-1.5"
                    size="sm"
                    disabled={
                      busyId === active.id || active.status !== 'PENDING'
                    }
                  >
                    <CheckCircle2Icon size={14} aria-hidden />
                    {t('radioSubmissionsTab.approveToRadio')}
                  </Button>
                  <Button
                    type="button"
                    className="gap-1.5"
                    size="sm"
                    variant="text"
                    disabled={
                      busyId === active.id || active.status === 'REJECTED'
                    }
                    onClick={() => {
                      setBusyId(active.id);
                      const row = active;
                      void rejectRadioSubmission(row.id, notes[row.id]).then(
                        (r) => {
                          setBusyId(null);
                          if (!r.ok) {
                            setMsg(r.error);
                          } else {
                            markDecided(row, 'REJECTED');
                          }
                        },
                      );
                    }}
                  >
                    <XCircleIcon size={14} aria-hidden />
                    {t('radioSubmissionsTab.reject')}
                  </Button>
                </div>
                <p className="text-foreground-secondary text-xs">
                  {t('radioSubmissionsTab.theArtistIsNotifiedWhen')}
                </p>
              </form>
            </StudioPanel>
          )}

          <StudioPanel>
            <ul className="divide-border divide-y">
              {items.map((row) => (
                <li
                  key={row.id}
                  className={`flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0 last:pb-0 ${
                    row.id === active?.id ? 'bg-background-secondary/40' : ''
                  }`}
                >
                  <Button
                    variant="plain"
                    size="flexible"
                    type="button"
                    onClick={() => setActiveId(row.id)}
                    className="inline-block min-w-0 flex-1 rounded-none text-left whitespace-normal active:scale-100"
                  >
                    <div className="font-medium">{row.sound.title}</div>
                    <div className="text-foreground-secondary text-xs">
                      {row.submitter?.displayName ?? '—'} ·{' '}
                      {fmtDuration(row.sound.durationSec)} ·{' '}
                      <ListingDate value={row.createdAt} />
                    </div>
                  </Button>
                  <Badge
                    variant="pill"
                    color={statusBadge(row.status).color}
                    className="shrink-0"
                  >
                    {statusBadge(row.status).label}
                  </Badge>
                </li>
              ))}
            </ul>
          </StudioPanel>
        </>
      )}
    </div>
  );
}
