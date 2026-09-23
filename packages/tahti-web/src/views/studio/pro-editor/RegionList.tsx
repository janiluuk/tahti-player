import { XIcon } from 'lucide-react';

import { Button } from '@tahti-player/ui';

import type { EditList } from '../../../api/studio-types';
import { formatClock } from './waveform/draw';

type Range = { start: number; end: number };

const PRECISION = 0.001;

function Chip({
  label,
  onOpen,
  onRemove,
  removeLabel,
}: {
  label: string;
  onOpen: () => void;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <span className="border-border inline-flex items-center rounded-md border">
      <Button size="xs" variant="text" onClick={onOpen} className="font-mono">
        {label}
      </Button>
      <Button
        size="xs"
        variant="text"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <XIcon size={12} aria-hidden />
      </Button>
    </span>
  );
}

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-foreground-secondary w-16 shrink-0">{title}</span>
      {children}
    </div>
  );
}

type Props = {
  cuts: EditList['cuts'];
  fades: EditList['fades'];
  markers: number[];
  onShowRange: (range: Range) => void;
  onSeek: (sec: number) => void;
  onRemoveCut: (index: number) => void;
  onRemoveFade: (index: number) => void;
  onRemoveMarker: (index: number) => void;
  onClearMarkers: () => void;
};

/** Every cut, fade and marker as a chip: open selects and zooms to it (or
 * seeks, for a marker), × removes it. */
export function RegionList({
  cuts,
  fades,
  markers,
  onShowRange,
  onSeek,
  onRemoveCut,
  onRemoveFade,
  onRemoveMarker,
  onClearMarkers,
}: Props) {
  if (cuts.length === 0 && fades.length === 0 && markers.length === 0) {
    return null;
  }
  const range = (start: number, end: number) =>
    `${formatClock(start, PRECISION)}–${formatClock(end, PRECISION)}`;
  return (
    <div className="mt-3 flex flex-col gap-2">
      {cuts.length > 0 && (
        <Row title="Cuts">
          {cuts.map((cut, index) => (
            <Chip
              key={`${cut.start}-${cut.end}`}
              label={range(cut.start, cut.end)}
              onOpen={() => onShowRange(cut)}
              onRemove={() => onRemoveCut(index)}
              removeLabel={`Remove cut ${range(cut.start, cut.end)}`}
            />
          ))}
        </Row>
      )}
      {fades.length > 0 && (
        <Row title="Fades">
          {fades.map((fade, index) => (
            <Chip
              key={`${fade.type}-${fade.at}-${fade.duration}`}
              label={`${fade.type === 'in' ? 'In' : 'Out'} ${range(fade.at, fade.at + fade.duration)}`}
              onOpen={() =>
                onShowRange({ start: fade.at, end: fade.at + fade.duration })
              }
              onRemove={() => onRemoveFade(index)}
              removeLabel={`Remove fade ${fade.type} at ${formatClock(fade.at, PRECISION)}`}
            />
          ))}
        </Row>
      )}
      {markers.length > 0 && (
        <Row title="Markers">
          {markers.map((marker, index) => (
            <Chip
              key={marker}
              label={formatClock(marker, PRECISION)}
              onOpen={() => onSeek(marker)}
              onRemove={() => onRemoveMarker(index)}
              removeLabel={`Remove marker at ${formatClock(marker, PRECISION)}`}
            />
          ))}
          <Button size="xs" variant="text" onClick={onClearMarkers}>
            Clear markers
          </Button>
        </Row>
      )}
    </div>
  );
}
