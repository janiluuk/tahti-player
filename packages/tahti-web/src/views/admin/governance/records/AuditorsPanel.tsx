import { useCallback, useEffect, useState } from 'react';

import {
  Badge,
  Button,
  InlineError,
  Input,
  Select,
  Toggle,
} from '@tahti-player/ui';

import {
  createAdminAuditor,
  endAdminAuditorTerm,
  fetchAdminAuditors,
} from '../../../../api/admin/admin-governance-auditors';
import type { GovernanceAuditor } from '../../../../api/governance-association';
import {
  PageEmpty,
  PageError,
  PageLoading,
} from '../../../../components/PageStates';
import { StudioPanel } from '../../../../components/StudioPanel';

const KIND_OPTIONS: Array<{ id: GovernanceAuditor['kind']; label: string }> = [
  { id: 'OPERATIONS_INSPECTOR', label: 'Operations inspector' },
  { id: 'AUDITOR', label: 'Auditor' },
];

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function auditorServing(
  auditor: GovernanceAuditor,
  now = new Date(),
): boolean {
  return (
    new Date(auditor.termStart) <= now &&
    (!auditor.termEnd || new Date(auditor.termEnd) > now)
  );
}

function roleLabel(auditor: GovernanceAuditor): string {
  const role = auditor.kind === 'AUDITOR' ? 'Auditor' : 'Operations inspector';
  return auditor.deputy ? `Deputy ${role.toLowerCase()}` : role;
}

function AddAuditorForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<GovernanceAuditor['kind']>(
    'OPERATIONS_INSPECTOR',
  );
  const [deputy, setDeputy] = useState(false);
  const [name, setName] = useState('');
  const [firm, setFirm] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" className="w-fit" onClick={() => setOpen(true)}>
        Add an auditor
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !termStart) {
          setError('Give the name and the day the term starts.');
          return;
        }
        setBusy(true);
        setError(null);
        void createAdminAuditor({
          kind,
          deputy,
          name,
          firm,
          termStart,
          ...(termEnd ? { termEnd } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          setName('');
          setFirm('');
          setTermStart('');
          setTermEnd('');
          setDeputy(false);
          onAdded();
        });
      }}
    >
      <Select
        label="Role"
        value={kind}
        onValueChange={(value) => setKind(value as GovernanceAuditor['kind'])}
        options={KIND_OPTIONS}
      />
      <Toggle label="Deputy" showLabel checked={deputy} onChange={setDeputy} />
      <div className="flex flex-wrap gap-2">
        <Input
          autoComplete="off"
          label="Name"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="Firm (optional)"
          value={firm}
          maxLength={200}
          onChange={(e) => setFirm(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          label="Term starts"
          type="date"
          value={termStart}
          onChange={(e) => setTermStart(e.target.value)}
        />
        <Input
          label="Term ends (optional)"
          type="date"
          value={termEnd}
          onChange={(e) => setTermEnd(e.target.value)}
        />
      </div>
      {error ? <InlineError>{error}</InlineError> : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Save auditor
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EndAuditorTerm({
  auditor,
  onEnded,
}: {
  auditor: GovernanceAuditor;
  onEnded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [termEnd, setTermEnd] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button
        size="sm"
        variant="secondary"
        className="w-fit"
        aria-label={`End term: ${auditor.name}`}
        onClick={() => setOpen(true)}
      >
        End term
      </Button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        void endAdminAuditorTerm(auditor.id, termEnd).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          onEnded();
        });
      }}
    >
      <Input
        label="Term ends on"
        type="date"
        value={termEnd}
        onChange={(e) => setTermEnd(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={busy || !termEnd}>
        Save end
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={busy}
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>
      {error ? (
        <InlineError textSize="xs" className="w-full">
          {error}
        </InlineError>
      ) : null}
    </form>
  );
}

/** Auditors and operations inspectors elected by the general meeting. */
export function AuditorsPanel() {
  const [auditors, setAuditors] = useState<GovernanceAuditor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchAdminAuditors();
    setAuditors(result.data);
    setLoadError(
      result.meta.source === 'api' ? (result.meta.reason ?? null) : null,
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <StudioPanel title="Auditors">
      <AddAuditorForm onAdded={() => void load()} />
      {auditors === null ? (
        <PageLoading label="Loading auditors…" />
      ) : loadError && auditors.length === 0 ? (
        <PageError
          title="Could not load auditors"
          description={loadError}
          onRetry={() => {
            setAuditors(null);
            void load();
          }}
        />
      ) : auditors.length === 0 ? (
        <PageEmpty title="No auditors recorded yet" />
      ) : (
        <ul className="divide-border divide-y">
          {auditors.map((auditor) => (
            <li
              key={auditor.id}
              className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {auditor.name}
                  {auditor.firm ? `, ${auditor.firm}` : ''}
                </span>
                <span className="text-foreground-secondary text-xs">
                  {roleLabel(auditor)}
                </span>
                <Badge
                  variant="pill"
                  color={auditorServing(auditor) ? 'green' : 'secondary'}
                >
                  {auditorServing(auditor) ? 'Serving' : 'Not serving'}
                </Badge>
              </div>
              <p className="text-foreground-secondary text-xs">
                {formatDay(auditor.termStart)} –{' '}
                {auditor.termEnd ? formatDay(auditor.termEnd) : 'open-ended'}
              </p>
              {auditorServing(auditor) ? (
                <EndAuditorTerm auditor={auditor} onEnded={() => void load()} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </StudioPanel>
  );
}
