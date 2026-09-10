import { CheckCircle2Icon, PlayIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button, ImageReveal, Textarea } from '@tahti-player/ui';

import {
  approveRadioSubmission,
  fetchAdminRadioSubmissionAudio,
  fetchAdminRadioSubmissions,
  rejectRadioSubmission,
  type AdminRadioSubmission,
  type AdminRadioSubmissionStatus,
} from '../../../../api/admin';
import { PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';
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
  const play = usePlayerStore((s) => s.play);
  const [items, setItems] = useState<AdminRadioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void fetchAdminRadioSubmissions().then((res) => {
      setItems(res.data);
      setLoading(false);
      setActiveId((prev) => prev ?? res.data[0]?.id ?? null);
    });
  };

  useEffect(reload, []);

  const active = items.find((i) => i.id === activeId) ?? items[0] ?? null;

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
        Audit tracks submitted for Tahti Radio rotation.
      </p>

      {msg && (
        <p className="text-foreground-secondary text-sm" role="status">
          {msg}
        </p>
      )}

      {loading ? (
        <StudioPanel>
          <PageLoading label="Loading radio submissions…" />
        </StudioPanel>
      ) : items.length === 0 ? (
        <StudioPanel>
          <p className="text-foreground-secondary py-4 text-center text-sm">
            No unaudited radio submissions.
          </p>
        </StudioPanel>
      ) : (
        <>
          {active && (
            <StudioPanel title="Auditing">
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
                    {busyId === active.id ? 'Loading…' : 'Play'}
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary text-xs uppercase">
                    Rejection note (optional)
                  </span>
                  <Textarea
                    tone="secondary"
                    value={notes[active.id] ?? ''}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [active.id]: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={
                      busyId === active.id || active.status !== 'PENDING'
                    }
                    onClick={() => {
                      setBusyId(active.id);
                      void approveRadioSubmission(active.id).then((r) => {
                        setBusyId(null);
                        if (!r.ok) {
                          setMsg(r.error);
                        } else {
                          reload();
                        }
                      });
                    }}
                  >
                    <CheckCircle2Icon size={14} aria-hidden />
                    Approve to radio
                  </Button>
                  <Button
                    size="sm"
                    variant="text"
                    disabled={
                      busyId === active.id || active.status === 'REJECTED'
                    }
                    onClick={() => {
                      setBusyId(active.id);
                      void rejectRadioSubmission(
                        active.id,
                        notes[active.id],
                      ).then((r) => {
                        setBusyId(null);
                        if (!r.ok) {
                          setMsg(r.error);
                        } else {
                          reload();
                        }
                      });
                    }}
                  >
                    <XCircleIcon size={14} aria-hidden />
                    Reject
                  </Button>
                </div>
              </div>
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
                  <button
                    type="button"
                    onClick={() => setActiveId(row.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="font-medium">{row.sound.title}</div>
                    <div className="text-foreground-secondary text-xs">
                      {row.submitter?.displayName ?? '—'} ·{' '}
                      {fmtDuration(row.sound.durationSec)} ·{' '}
                      {new Date(row.createdAt).toLocaleDateString()}
                    </div>
                  </button>
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
