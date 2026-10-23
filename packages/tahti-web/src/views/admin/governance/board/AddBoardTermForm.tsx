import { useState } from 'react';

import { Button, InlineError, Input, Select } from '@tahti-player/ui';

import { createAdminBoardTerm } from '../../../../api/admin/admin-governance-board';
import {
  BOARD_ROLE_LABELS,
  type GovernanceBoardRole,
} from '../../../../api/governance-board';
import { MemberPicker, type PickedMember } from './MemberPicker';

export const BOARD_ROLE_OPTIONS = (
  Object.keys(BOARD_ROLE_LABELS) as GovernanceBoardRole[]
).map((id) => ({ id, label: BOARD_ROLE_LABELS[id] }));

/** Record a member's board term. */
export function AddBoardTermForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<PickedMember | null>(null);
  const [role, setRole] = useState<GovernanceBoardRole>('MEMBER');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" className="w-fit" onClick={() => setOpen(true)}>
        Add a board term
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!member || !termStart) {
          setError('Choose the member and the day the term starts.');
          return;
        }
        setBusy(true);
        setError(null);
        void createAdminBoardTerm({
          userId: member.id,
          displayName: member.displayName,
          role,
          termStart,
          ...(termEnd ? { termEnd } : {}),
        }).then((result) => {
          setBusy(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setOpen(false);
          setMember(null);
          setTermStart('');
          setTermEnd('');
          onAdded();
        });
      }}
    >
      <MemberPicker label="Member" value={member} onChange={setMember} />
      <Select
        label="Role"
        value={role}
        onValueChange={(value) => setRole(value as GovernanceBoardRole)}
        options={BOARD_ROLE_OPTIONS}
      />
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
          Save term
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
