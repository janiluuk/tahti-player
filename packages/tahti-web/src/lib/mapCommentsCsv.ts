import { MAP_CASE_GROUPS } from '../content/mapScreens';
import type { MapComment } from '../stores/mapNotesStore';

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function caseLookup(): Record<
  string,
  { title: string; viewName: string; route: string }
> {
  const map: Record<
    string,
    { title: string; viewName: string; route: string }
  > = {};
  for (const group of MAP_CASE_GROUPS) {
    for (const c of group.cases) {
      map[c.id] = {
        title: c.title,
        viewName: c.viewName,
        route: c.new.route,
      };
    }
  }
  return map;
}

/** CSV for handing atlas comments to fix — open and resolved rows included. */
export function commentsToCsv(comments: MapComment[]): string {
  const lookup = caseLookup();
  const header = [
    'status',
    'kind',
    'target_id',
    'title',
    'view_name',
    'route',
    'pack',
    'feature',
    'commentary',
    'submitted_at',
    'updated_at',
    'resolved_at',
  ];
  const rows = comments.map((c) => {
    const meta = lookup[c.targetId];
    return [
      c.resolvedAt ? 'resolved' : 'open',
      c.kind,
      c.targetId,
      c.title,
      meta?.viewName ?? '',
      meta?.route ?? '',
      c.pack ?? '',
      c.feature ?? '',
      c.text,
      c.submittedAt,
      c.updatedAt ?? '',
      c.resolvedAt ?? '',
    ];
  });
  return [header, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}

export function downloadMapCommentsCsv(comments: MapComment[]): void {
  const csv = commentsToCsv(comments);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `tahti-map-notes-${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
