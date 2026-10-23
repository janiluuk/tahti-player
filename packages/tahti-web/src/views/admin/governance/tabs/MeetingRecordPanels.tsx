import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import {
  Badge,
  Button,
  InlineLoader,
  Input,
  Textarea,
  Toggle,
} from '@tahti-player/ui';

import {
  declareAdminGovernanceConflict,
  fetchAdminGovernanceConflicts,
  fetchAdminGovernanceNoticeDeliveries,
  removeAdminGovernanceConflict,
  type GovernanceConflictDeclaration,
  type GovernanceNoticeDelivery,
} from '../../../../api/admin';
import { PageEmpty } from '../../../../components/PageStates';

export function CollapsibleRecord({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-border mt-2 rounded-md border">
      <Button
        type="button"
        variant="text"
        size="flexible"
        aria-expanded={open}
        className="text-foreground-secondary hover:text-foreground flex w-full items-center justify-between gap-1.5 px-3 py-2 text-xs"
        onClick={onToggle}
      >
        <span>{label}</span>
        {open ? (
          <ChevronUpIcon size={14} aria-hidden />
        ) : (
          <ChevronDownIcon size={14} aria-hidden />
        )}
      </Button>
      {open ? (
        <div className="border-border border-t p-3">{children}</div>
      ) : null}
    </div>
  );
}

export function ConflictsPanel({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<
    GovernanceConflictDeclaration[] | null
  >(null);
  const [name, setName] = useState('');
  const [matter, setMatter] = useState('');
  const [recused, setRecused] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setRecords(null);
    void fetchAdminGovernanceConflicts(meetingId).then((result) => {
      if (!result.ok) {
        setError(result.error);
        setRecords([]);
        return;
      }
      setRecords(result.data);
    });
  }, [open, meetingId]);

  return (
    <CollapsibleRecord
      label={`Conflicts of interest${records ? ` (${records.length})` : ''}`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {records === null ? (
        <InlineLoader label="Loading…" textSize="xs" />
      ) : records.length === 0 ? (
        <p className="text-foreground-secondary text-xs">
          No conflicts declared for this meeting.
        </p>
      ) : (
        <ul className="divide-border mb-3 divide-y text-sm">
          {records.map((record) => (
            <li key={record.id} className="flex flex-col gap-0.5 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{record.displayName}</span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="pill"
                    color={record.recused ? 'yellow' : 'secondary'}
                  >
                    {record.recused ? 'Recused' : 'Took part'}
                  </Badge>
                  <Button
                    size="xs"
                    variant="secondary"
                    aria-label={`Remove declaration: ${record.displayName}`}
                    onClick={() => {
                      setError(null);
                      void removeAdminGovernanceConflict(record.id).then(
                        (result) => {
                          if (!result.ok) {
                            setError(result.error);
                            return;
                          }
                          setRecords((current) =>
                            (current ?? []).filter((r) => r.id !== record.id),
                          );
                        },
                      );
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <p className="text-foreground-secondary text-xs">
                {record.matter}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2">
        <Input
          label="Member name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea
          label="Matter"
          value={matter}
          rows={2}
          maxLength={2000}
          onChange={(event) => setMatter(event.target.value)}
        />
        <Toggle
          label="Stepped out of the decision"
          checked={recused}
          onChange={setRecused}
        />
        {error ? (
          <p className="text-accent-red-strong text-xs" role="alert">
            {error}
          </p>
        ) : null}
        <div>
          <Button
            size="sm"
            disabled={saving || !name.trim() || !matter.trim()}
            onClick={() => {
              setSaving(true);
              setError(null);
              void declareAdminGovernanceConflict(meetingId, {
                displayName: name,
                matter,
                recused,
              }).then((result) => {
                setSaving(false);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setRecords((current) => [...(current ?? []), result.data]);
                setName('');
                setMatter('');
                setRecused(true);
              });
            }}
          >
            {saving ? 'Recording…' : 'Record declaration'}
          </Button>
        </div>
      </div>
    </CollapsibleRecord>
  );
}

export function NoticeDeliveriesPanel({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [records, setRecords] = useState<GovernanceNoticeDelivery[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setRecords(null);
    setError(null);
    void fetchAdminGovernanceNoticeDeliveries(meetingId).then((result) => {
      if (!result.ok) {
        setError(result.error);
        setRecords([]);
        return;
      }
      setRecords(result.data);
    });
  }, [open, meetingId]);

  const bounced = records?.filter((record) => record.bouncedAt).length ?? 0;

  return (
    <CollapsibleRecord
      label={`Notice deliveries${records ? ` (${records.length} sent${bounced ? `, ${bounced} bounced` : ''})` : ''}`}
      open={open}
      onToggle={() => setOpen((value) => !value)}
    >
      {error ? (
        <p className="text-accent-red-strong text-xs" role="alert">
          {error}
        </p>
      ) : records === null ? (
        <InlineLoader label="Loading…" textSize="xs" />
      ) : records.length === 0 ? (
        <PageEmpty title="No meeting notice has been sent yet." />
      ) : (
        <ul className="divide-border divide-y text-sm">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {record.displayName && !record.displayName.includes('@')
                    ? record.displayName
                    : 'Unnamed member'}
                </div>
                <div className="text-foreground-secondary text-xs">
                  {record.email} · sent{' '}
                  {new Date(record.sentAt).toLocaleString()}
                </div>
              </div>
              {record.bouncedAt ? (
                <Badge variant="pill" color="red">
                  Bounced
                </Badge>
              ) : (
                <Badge variant="pill" color="green">
                  Sent
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleRecord>
  );
}
