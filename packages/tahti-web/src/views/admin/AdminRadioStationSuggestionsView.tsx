import { RadioIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge, Button } from '@nuclearplayer/ui';

import {
  approveRadioStationSuggestion,
  fetchAdminRadioStationSuggestions,
  rejectRadioStationSuggestion,
  type AdminRadioStationSuggestion,
  type AdminRadioStationSuggestionStatus,
} from '../../api/admin';
import { AdminGate } from '../../components/AdminGate';
import { AdminNav } from '../../components/AdminNav';
import { PageLoading } from '../../components/PageStates';
import { StudioPageHeader, StudioPanel } from '../../components/StudioPanel';

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

export function AdminRadioStationSuggestionsView() {
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
    <AdminGate>
      <div className="admin-page-layout mx-auto flex max-w-3xl flex-col gap-6 px-1 py-2">
        <AdminNav current="/admin/radio-station-suggestions" />
        <StudioPageHeader
          title="Radio stations"
          subtitle="Listener-suggested internet radio stations for the Widgets store — approve to add them to the shared catalog."
        />

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
            <p className="text-foreground-secondary py-4 text-center text-sm">
              No pending station suggestions.
            </p>
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
                      {row.logoUrl ? (
                        <img
                          src={row.logoUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <RadioIcon
                          size={22}
                          className="text-foreground-secondary"
                          aria-hidden
                        />
                      )}
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
                        <textarea
                          value={notes[row.id] ?? ''}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                          rows={2}
                          className="border-border bg-background rounded-md border px-3 py-2"
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
    </AdminGate>
  );
}
