import { BarChart3Icon, HistoryIcon } from 'lucide-react';

import { Tabs, ViewShell } from '@tahti-player/ui';

import { HistoryListSection } from '../components/history/HistoryListSection';
import { HistoryStatsSection } from '../components/history/HistoryStatsSection';
import { useLibraryStore } from '../stores/libraryStore';

/** Ported from Nuclear desktop's History view (packages/player/src/views/
 * History) — same two-tab layout (Stats / Listening history) and the same
 * `@tahti-player/ui` chart/list components. Nuclear's version reads a
 * local SQLite play log with per-play listening duration; this reads
 * Tahti's lighter localStorage `history` (a play-event timestamp, deduped
 * to one row per track) — see src/lib/historyStats.ts for how listening
 * time is approximated from that.
 *
 * The surrounding page is the scroll container, so the tab panels flow at
 * their natural height; a fixed-height `overflow-hidden` chain collapses
 * them to nothing when the parent has no definite height. */
export function HistoryView({ embedded = false }: { embedded?: boolean }) {
  const history = useLibraryStore((s) => s.history);

  const tabs = (
    <Tabs
      className="flex flex-col"
      panelClassName="flex flex-col"
      items={[
        {
          id: 'stats',
          label: 'Stats',
          icon: <BarChart3Icon size={14} />,
          content: <HistoryStatsSection history={history} />,
        },
        {
          id: 'listening-history',
          label: 'Listening history',
          icon: <HistoryIcon size={14} />,
          content: <HistoryListSection history={history} />,
        },
      ]}
    />
  );

  if (embedded) {
    return tabs;
  }

  return (
    <ViewShell title="History" classes={{ root: 'px-0 pt-0' }}>
      {tabs}
    </ViewShell>
  );
}
