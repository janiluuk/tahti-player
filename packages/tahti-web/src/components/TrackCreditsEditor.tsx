import { ChevronDownIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button, Input, Select, Tooltip } from '@tahti-player/ui';

import {
  RELEASE_CREDIT_ROLES,
  type ReleaseCredit,
  type ReleaseCreditRole,
} from '../api/studio-types';
import { cn } from '../lib/cn';

type Props = {
  value: ReleaseCredit[];
  onChange: (next: ReleaseCredit[]) => void;
  disabled?: boolean;
};

/** Extra contributor credits (beyond the channel's Members/Credits roster)
 * for a single track — collapsed by default since most tracks don't need
 * this, same role vocabulary as release credits (StudioDistributionView's
 * "Credits & roles" editor). */
export function TrackCreditsEditor({ value, onChange, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-border rounded-xl border">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span>
          <span className="block font-medium">
            Extra credits &amp; roles
            {value.length > 0 ? ` (${value.length})` : ''}
          </span>
          <span className="text-foreground-secondary block text-xs">
            Writers, performers, producers, etc. beyond your channel&apos;s
            usual roster.
          </span>
        </span>
        <ChevronDownIcon
          size={18}
          aria-hidden
          className={cn('transition-transform', expanded && 'rotate-180')}
        />
      </button>
      {expanded && (
        <div className="border-border border-t p-4 pt-3">
          {value.length === 0 && (
            <p className="text-foreground-secondary mb-2 text-xs">
              No extra credits yet.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {value.map((credit, index) => (
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
                  disabled={disabled}
                  label="Credit role"
                  onValueChange={(role) => {
                    const next = [...value];
                    next[index] = {
                      ...credit,
                      role: role as ReleaseCreditRole,
                    };
                    onChange(next);
                  }}
                />
                <Input
                  value={credit.name}
                  placeholder="Name"
                  disabled={disabled}
                  aria-label="Credit name"
                  onChange={(event) => {
                    const next = [...value];
                    next[index] = { ...credit, name: event.target.value };
                    onChange(next);
                  }}
                />
                <Input
                  value={
                    credit.artistUsername ? `@${credit.artistUsername}` : ''
                  }
                  placeholder="@username"
                  disabled={disabled}
                  maxLength={33}
                  aria-label="Tahti username"
                  onChange={(event) => {
                    const raw = event.target.value
                      .trim()
                      .replace(/^@/, '')
                      .toLowerCase();
                    const next = [...value];
                    next[index] = {
                      ...credit,
                      artistUsername: raw.length > 0 ? raw : undefined,
                    };
                    onChange(next);
                  }}
                />
                <Tooltip
                  content={`Remove credit ${credit.name || index + 1}`}
                  side="top"
                >
                  <Button
                    size="icon-sm"
                    variant="text"
                    disabled={disabled}
                    aria-label={`Remove credit ${credit.name || index + 1}`}
                    onClick={() =>
                      onChange(value.filter((_, i) => i !== index))
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
            disabled={disabled}
            onClick={() => onChange([...value, { role: 'writer', name: '' }])}
          >
            <PlusIcon size={14} aria-hidden className="mr-1.5" />
            Add credit
          </Button>
        </div>
      )}
    </div>
  );
}
