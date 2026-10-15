import { HorizontalScroll } from '@tahti-player/ui';

import {
  countByStatus,
  PORT_BACKLOG,
  PORT_GAP_HIGHLIGHTS,
  PORT_MOCK_INVENTORY,
  PORT_STATUS_LABEL,
  type PortInventoryItem,
  type PortStatus,
} from '../content/portInventory';

function statusClass(status: PortStatus): string {
  switch (status) {
    case 'done':
      return 'bg-primary text-primary-foreground';
    case 'partial':
      return 'border-border text-foreground border';
    case 'missing':
    case 'unwired':
      return 'bg-accent-red/20 text-foreground border-accent-red/40 border';
    case 'mock-only':
      return 'bg-background-secondary text-foreground-secondary';
    case 'link-out':
      return 'border-border text-foreground-secondary border';
    case 'out-of-scope':
      return 'bg-background-secondary text-foreground-secondary opacity-80';
    default:
      return '';
  }
}

function StatusBadge({ status }: { status: PortStatus }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${statusClass(status)}`}
    >
      {PORT_STATUS_LABEL[status]}
    </span>
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
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-border text-foreground-secondary border-b text-xs uppercase">
              <th className="py-2 pr-3 font-medium">Surface</th>
              <th className="py-2 pr-3 font-medium">POC route</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-border border-b align-top">
                <td className="py-3 pr-3 font-medium">{row.surface}</td>
                <td className="text-foreground-secondary py-3 pr-3 font-mono text-xs">
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
                </td>
                <td className="py-3 pr-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="text-foreground-secondary py-3 text-xs">
                  {row.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
