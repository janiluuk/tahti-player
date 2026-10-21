import type { ComponentProps } from 'react';

import {
  Badge,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  HorizontalScroll,
} from '@tahti-player/ui';

import {
  countByStatus,
  PORT_BACKLOG,
  PORT_GAP_HIGHLIGHTS,
  PORT_MOCK_INVENTORY,
  PORT_STATUS_LABEL,
  type PortInventoryItem,
  type PortStatus,
} from '../content/portInventory';

type BadgeColor = NonNullable<ComponentProps<typeof Badge>['color']>;

const STATUS_COLOR: Record<PortStatus, BadgeColor> = {
  done: 'green',
  partial: 'yellow',
  missing: 'red',
  unwired: 'red',
  'mock-only': 'secondary',
  'link-out': 'blue',
  'out-of-scope': 'secondary',
};

function StatusBadge({ status }: { status: PortStatus }) {
  return (
    <Badge variant="pill" color={STATUS_COLOR[status]}>
      {PORT_STATUS_LABEL[status]}
    </Badge>
  );
}

function InventoryTable({
  id,
  title,
  description,
  rows,
}: {
  id: string;
  title: string;
  description: string;
  rows: PortInventoryItem[];
}) {
  return (
    <section id={id} className="flex scroll-mt-8 flex-col gap-3">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight">
          {title}
        </h2>
        <p className="text-foreground-secondary mt-1 max-w-2xl text-sm">
          {description}
        </p>
      </div>
      <HorizontalScroll label={title}>
        <DataTable className="min-w-[560px]">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Surface</DataTableHeaderCell>
              <DataTableHeaderCell>POC route</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Detail</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {rows.map((row) => (
              <DataTableRow key={row.id} className="align-top">
                <DataTableCell className="font-medium">
                  {row.surface}
                </DataTableCell>
                <DataTableCell className="text-foreground-secondary font-mono text-xs">
                  {row.route ? (
                    row.route.includes('$') ? (
                      row.route
                    ) : (
                      <a
                        href={row.route}
                        className="text-foreground hover:underline"
                      >
                        {row.route}
                      </a>
                    )
                  ) : (
                    '—'
                  )}
                </DataTableCell>
                <DataTableCell>
                  <StatusBadge status={row.status} />
                </DataTableCell>
                <DataTableCell className="text-foreground-secondary text-xs">
                  {row.detail}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </HorizontalScroll>
    </section>
  );
}

export function PortInventoryPanel() {
  const backlogOpen = PORT_BACKLOG.filter((r) => r.status !== 'done');
  const counts = countByStatus([
    ...PORT_BACKLOG,
    ...PORT_MOCK_INVENTORY,
    ...PORT_GAP_HIGHLIGHTS,
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section
        id="port-summary"
        className="border-border bg-background-secondary/40 flex flex-col gap-3 rounded-xl border p-4"
      >
        <h2 className="font-display text-xl font-extrabold tracking-tight">
          Port checklist summary
        </h2>
        <p className="text-foreground-secondary max-w-2xl text-sm">
          Living inventory of what is wired vs mock / missing in this Nuclear
          client. Source of truth:{' '}
          <code className="text-foreground">FEATURES.md</code>,{' '}
          <code className="text-foreground">MOCKS.md</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              'done',
              'partial',
              'missing',
              'unwired',
              'mock-only',
              'link-out',
              'out-of-scope',
            ] as PortStatus[]
          ).map((s) =>
            counts[s] ? (
              <span
                key={s}
                className="border-border text-foreground-secondary inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"
              >
                <StatusBadge status={s} />
                <span>{counts[s]}</span>
              </span>
            ) : null,
          )}
        </div>
        <nav
          aria-label="Jump to section"
          className="flex flex-wrap gap-2 pt-1 text-xs"
        >
          <a
            href="#port-backlog"
            className="border-border hover:text-foreground rounded border px-2.5 py-1 tracking-wide uppercase"
          >
            Open backlog ({backlogOpen.length})
          </a>
          <a
            href="#port-mock"
            className="border-border hover:text-foreground rounded border px-2.5 py-1 tracking-wide uppercase"
          >
            Mock / unwired
          </a>
          <a
            href="#port-gaps"
            className="border-border hover:text-foreground rounded border px-2.5 py-1 tracking-wide uppercase"
          >
            Gap highlights
          </a>
          <a
            href="#screen-atlas-heading"
            className="border-border hover:text-foreground rounded border px-2.5 py-1 tracking-wide uppercase"
          >
            Screen atlas
          </a>
        </nav>
      </section>

      <InventoryTable
        id="port-backlog"
        title="Priority backlog"
        description="Next ports ordered by listener/artist value × API readiness. UI that is not done must stay honest (disabled / coming soon / link-out)."
        rows={PORT_BACKLOG}
      />

      <InventoryTable
        id="port-mock"
        title="Mock / stub / unwired"
        description="Looks like product UI but is incomplete, offline-only, or still opens production."
        rows={PORT_MOCK_INVENTORY}
      />

      <InventoryTable
        id="port-gaps"
        title="Gap highlights"
        description="Selected rows from the prod → POC gap matrix (recently shipped + still open)."
        rows={PORT_GAP_HIGHLIGHTS}
      />
    </div>
  );
}
