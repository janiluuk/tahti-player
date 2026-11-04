import { CheckIcon, ListMusicIcon, PlusIcon, SearchIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, Input, MediaArtwork } from '@tahti-player/ui';

export type MaterialMembershipRow = {
  id: string;
  name: string;
  coverUrl?: string | null;
  meta: string;
  selected: boolean;
  pending?: boolean;
  disabled?: boolean;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  rows: MaterialMembershipRow[];
  onToggle: (id: string) => void;
  busyId?: string | null;
  emptyLabel: string;
  footer?: ReactNode;
  creating?: ReactNode;
};

/** Searchable membership list with immediate toggle rows — shared by Sets and Groups cards. */
export function MaterialMembershipList({
  search,
  onSearchChange,
  searchPlaceholder,
  rows,
  onToggle,
  busyId,
  emptyLabel,
  footer,
  creating,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <SearchIcon
          size={16}
          className="text-foreground-secondary pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
          aria-hidden
        />
        <Input
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="pl-9"
        />
      </div>
      <ul className="border-border max-h-64 overflow-y-auto rounded-lg border">
        {rows.length === 0 ? (
          <li className="text-foreground-secondary px-3 py-6 text-center text-sm">
            {emptyLabel}
          </li>
        ) : (
          rows.map((row) => {
            const busy = busyId === row.id;
            return (
              <li
                key={row.id}
                className="border-border border-b last:border-b-0"
              >
                <button
                  type="button"
                  disabled={row.disabled || busy}
                  onClick={() => onToggle(row.id)}
                  aria-pressed={row.selected}
                  className={`hover:bg-background-secondary/60 flex w-full items-center gap-3 px-3 py-2.5 text-left disabled:opacity-50 ${
                    row.selected ? 'bg-background-secondary/40' : ''
                  }`}
                >
                  {row.coverUrl ? (
                    <MediaArtwork
                      src={row.coverUrl}
                      size="sm"
                      className="size-10 shrink-0 rounded-md"
                      alt=""
                    />
                  ) : (
                    <span className="bg-background-secondary text-foreground-secondary flex size-10 shrink-0 items-center justify-center rounded-md">
                      <ListMusicIcon size={18} aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block truncate text-sm font-semibold">
                      {row.name}
                    </span>
                    <span className="text-foreground-secondary block truncate text-xs">
                      {row.pending ? 'Pending approval' : row.meta}
                    </span>
                  </span>
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      row.selected
                        ? 'border-accent-red bg-accent-red text-white'
                        : 'border-border'
                    }`}
                    aria-hidden
                  >
                    {row.selected ? (
                      <CheckIcon size={12} strokeWidth={3} />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
      {creating}
      {footer}
    </div>
  );
}

export function MaterialMembershipCreateFooter({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="self-start rounded-full"
      onClick={onClick}
      disabled={disabled}
    >
      <PlusIcon size={14} aria-hidden className="mr-1" />
      {label}
    </Button>
  );
}
