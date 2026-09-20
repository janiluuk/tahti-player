import {
  CheckCircle2Icon,
  LoaderCircleIcon,
  RadioIcon,
  XCircleIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button, ImageReveal, Textarea } from '@tahti-player/ui';

import {
  approveRadioStationSuggestion,
  fetchAdminRadioStationSuggestions,
  rejectRadioStationSuggestion,
  type AdminRadioStationSuggestion,
  type AdminRadioStationSuggestionStatus,
} from '../../../../api/admin';
import { PageEmpty, PageLoading } from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

function statusBadge(status: AdminRadioStationSuggestionStatus): {
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

/** Radio station suggestions tab — ported as-is from the standalone
 * `/admin/radio-station-suggestions` route (see AdminOrphanPagesView). */
export function RadioStationSuggestionsTab() {
  const [items, setItems] = useState<AdminRadioStationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = () => {
    void fetchAdminRadioStationSuggestions().then((res) => {
      setItems(res.data);
      setLoading(false);
    });
  };

  useEffect(reload, []);

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-foreground-secondary text-sm">
        Listener-suggested internet radio stations for the Widgets store —
        approve to add them to the shared catalog.
      </p>

      {msg && (
        <p className="text-foreground-secondary text-sm" role="status">
          {msg}
        </p>
      )}

      {loading ? (
        <StudioPanel>
          <PageLoading label="Loading station suggestions…" />
        </StudioPanel>
      ) : items.length === 0 ? (
        <StudioPanel>
          <PageEmpty title="No pending station suggestions" />
        </StudioPanel>
      ) : (
        <StudioPanel>
          <ul className="divide-border divide-y">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-surface-secondary flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                    <ImageReveal
                      src={row.logoUrl ?? undefined}
                      alt=""
                      className="size-full"
                      placeholder={
                        <RadioIcon
                          size={22}
                          className="text-foreground-secondary"
                          aria-hidden
                        />
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold">{row.name}</h3>
                    <p className="text-foreground-secondary text-sm">
                      {row.language}
                      {row.bitrateKbps != null
                        ? ` · ${row.bitrateKbps}kbps`
                        : ''}
                      {' · '}
                      {row.submitter?.displayName ?? 'Unknown submitter'}
                    </p>
                    <p className="text-foreground-secondary mt-1 font-mono text-xs break-all">
                      {row.streamUrl}
                    </p>
                  </div>
                  <Badge
                    variant="pill"
                    color={statusBadge(row.status).color}
                    className="shrink-0"
                  >
                    {statusBadge(row.status).label}
                  </Badge>
                </div>

                {row.status === 'PENDING' && (
                  <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="text-foreground-secondary text-xs uppercase">
                        Rejection note (optional)
                      </span>
                      <Textarea
                        tone="secondary"
                        value={notes[row.id] ?? ''}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                        rows={2}
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === row.id}
                        onClick={() => {
                          setBusyId(row.id);
                          void approveRadioStationSuggestion(row.id).then(
                            (r) => {
                              setBusyId(null);
                              if (!r.ok) {
                                setMsg(r.error);
                              } else {
                                setMsg(`Approved ${row.name}.`);
                                reload();
                              }
                            },
                          );
                        }}
                      >
                        {busyId === row.id ? (
                          <LoaderCircleIcon
                            size={14}
                            aria-hidden
                            className="mr-1.5 animate-spin"
                          />
                        ) : (
                          <CheckCircle2Icon
                            size={14}
                            aria-hidden
                            className="mr-1.5"
                          />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="text"
                        disabled={busyId === row.id}
                        onClick={() => {
                          setBusyId(row.id);
                          void rejectRadioStationSuggestion(
                            row.id,
                            notes[row.id],
                          ).then((r) => {
                            setBusyId(null);
                            if (!r.ok) {
                              setMsg(r.error);
                            } else {
                              setMsg(`Rejected ${row.name}.`);
                              reload();
                            }
                          });
                        }}
                      >
                        {busyId === row.id ? (
                          <LoaderCircleIcon
                            size={14}
                            aria-hidden
                            className="mr-1.5 animate-spin"
                          />
                        ) : (
                          <XCircleIcon
                            size={14}
                            aria-hidden
                            className="mr-1.5"
                          />
                        )}
                        Reject
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </StudioPanel>
      )}
    </div>
  );
}
