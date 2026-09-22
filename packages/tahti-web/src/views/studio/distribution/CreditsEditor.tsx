import { PlusIcon, Trash2Icon } from 'lucide-react';

import { Button, Input, Select, Tooltip } from '@tahti-player/ui';

import type {
  ReleaseCredit,
  ReleaseCreditRole,
} from '../../../api/studio-types';
import { RELEASE_CREDIT_ROLES } from '../../../api/studio-types';

export function CreditsEditor({
  credits,
  setCredits,
  busy,
}: {
  credits: ReleaseCredit[];
  setCredits: (credits: ReleaseCredit[]) => void;
  busy: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium">Credits & roles</p>
      {credits.length === 0 && (
        <p className="text-foreground-secondary mb-2 text-xs">
          No credits yet — add writers, performers, producers, etc.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {credits.map((credit, index) => (
          <li
            key={index}
            className="grid gap-2 sm:grid-cols-[8rem_1fr_8rem_auto]"
          >
            <Select
              className="text-xs"
              options={RELEASE_CREDIT_ROLES.map((role) => ({
                id: role,
                label: role,
              }))}
              value={credit.role}
              disabled={busy}
              label="Credit role"
              onValueChange={(role) => {
                const next = [...credits];
                next[index] = {
                  ...credit,
                  role: role as ReleaseCreditRole,
                };
                setCredits(next);
              }}
            />
            <Input
              value={credit.name}
              placeholder="Name"
              disabled={busy}
              aria-label="Credit name"
              onChange={(e) => {
                const next = [...credits];
                next[index] = { ...credit, name: e.target.value };
                setCredits(next);
              }}
            />
            <Input
              value={credit.artistUsername ? `@${credit.artistUsername}` : ''}
              placeholder="@username"
              disabled={busy}
              maxLength={33}
              aria-label="Tahti username"
              onChange={(e) => {
                const raw = e.target.value
                  .trim()
                  .replace(/^@/, '')
                  .toLowerCase();
                const next = [...credits];
                next[index] = {
                  ...credit,
                  artistUsername: raw.length > 0 ? raw : undefined,
                };
                setCredits(next);
              }}
            />
            <Tooltip content="Remove credit" side="top">
              <Button
                size="icon-sm"
                variant="text"
                disabled={busy}
                aria-label={`Remove credit ${credit.name || index + 1}`}
                onClick={() =>
                  setCredits(credits.filter((_, i) => i !== index))
                }
              >
                <Trash2Icon size={14} aria-hidden />
              </Button>
            </Tooltip>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="secondary"
        className="mt-2"
        disabled={busy}
        onClick={() => setCredits([...credits, { role: 'writer', name: '' }])}
      >
        <PlusIcon size={14} aria-hidden className="mr-1.5" />
        Add credit
      </Button>
    </div>
  );
}
