import { FC } from 'react';

import { formatDateTime } from '../../utils/time';
import { CopyButton } from '../CopyButton';
import { Dialog } from '../Dialog';
import { useLogViewerContext } from './context';

/** Full-entry view opened by clicking a log row — the row itself only shows
 * a truncated/collapsed message, this shows everything with no clipping. */
export const LogEntryDetailDialog: FC = () => {
  const { selectedEntry, setSelectedEntry, labels } = useLogViewerContext();

  return (
    <Dialog
      isOpen={selectedEntry !== null}
      onClose={() => setSelectedEntry(null)}
      title={labels.entryDetailTitle}
      actions={
        selectedEntry && (
          <CopyButton
            text={selectedEntry.message}
            toastMessage="Log message copied."
          />
        )
      }
    >
      {selectedEntry && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-foreground/60">Timestamp</dt>
          <dd className="font-mono">
            {formatDateTime(selectedEntry.timestamp)}
          </dd>
          <dt className="text-foreground/60">Level</dt>
          <dd className="font-mono uppercase">{selectedEntry.level}</dd>
          <dt className="text-foreground/60">Source</dt>
          <dd className="font-mono">
            {selectedEntry.source.type} / {selectedEntry.source.scope}
          </dd>
          <dt className="text-foreground/60">Target</dt>
          <dd className="font-mono">{selectedEntry.target}</dd>
          <dt className="text-foreground/60 self-start">Message</dt>
          <dd className="font-mono break-all whitespace-pre-wrap">
            {selectedEntry.message}
          </dd>
        </dl>
      )}
    </Dialog>
  );
};
