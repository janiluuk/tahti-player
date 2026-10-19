import { AlignJustifyIcon, Rows2Icon, Rows3Icon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { SegmentedControl } from '@tahti-player/ui';

import { cn } from '../lib/cn';
import {
  AmbientTrackRow,
  type AmbientTrackRowDensity,
  type AmbientTrackRowProps,
} from './AmbientTrackRow';

export const AMBIENT_TRACK_DENSITIES: AmbientTrackRowDensity[] = [
  'comfortable',
  'compact',
  'dense',
];

const SIZE_OPTIONS = [
  {
    id: 'comfortable' as const,
    label: 'Large',
    icon: <Rows3Icon size={14} aria-hidden />,
  },
  {
    id: 'compact' as const,
    label: 'Medium',
    icon: <Rows2Icon size={14} aria-hidden />,
  },
  {
    id: 'dense' as const,
    label: 'Small',
    icon: <AlignJustifyIcon size={14} aria-hidden />,
  },
];

const STORAGE_KEY = 'tahti.ambientTrackList.density';

function readStoredDensity(
  fallback: AmbientTrackRowDensity,
): AmbientTrackRowDensity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (
      raw &&
      AMBIENT_TRACK_DENSITIES.includes(raw as AmbientTrackRowDensity)
    ) {
      return raw as AmbientTrackRowDensity;
    }
  } catch {
    /* private mode */
  }
  return fallback;
}

export type AmbientTrackListItem = Omit<
  AmbientTrackRowProps,
  'density' | 'className'
> & {
  id: string;
};

export type AmbientTrackListProps = {
  items: AmbientTrackListItem[];
  /** Controlled density — omit to self-manage (+ persist). */
  density?: AmbientTrackRowDensity;
  defaultDensity?: AmbientTrackRowDensity;
  onDensityChange?: (density: AmbientTrackRowDensity) => void;
  /** Persist density to localStorage (default true when uncontrolled). */
  persistDensity?: boolean;
  emptyMessage?: string;
  /** Extra controls beside the size switcher. */
  toolbarEnd?: ReactNode;
  className?: string;
};

export function AmbientTrackList({
  items,
  density: densityProp,
  defaultDensity = 'comfortable',
  onDensityChange,
  persistDensity,
  emptyMessage = 'No tracks yet.',
  toolbarEnd,
  className,
}: AmbientTrackListProps) {
  const controlled = densityProp !== undefined;
  const shouldPersist = persistDensity ?? !controlled;
  const [internal, setInternal] = useState<AmbientTrackRowDensity>(() =>
    shouldPersist ? readStoredDensity(defaultDensity) : defaultDensity,
  );
  const density = controlled ? densityProp : internal;

  useEffect(() => {
    if (!shouldPersist) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      /* ignore */
    }
  }, [density, shouldPersist]);

  const setDensity = (next: AmbientTrackRowDensity) => {
    if (!controlled) {
      setInternal(next);
    }
    onDensityChange?.(next);
  };

  return (
    <section
      className={cn('flex w-full min-w-0 flex-col gap-3', className)}
      data-testid="ambient-track-list"
      data-density={density}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SegmentedControl
          aria-label="Track size"
          iconOnly
          options={SIZE_OPTIONS}
          value={density}
          onChange={setDensity}
        />
        {toolbarEnd ? (
          <div className="flex flex-wrap items-center gap-2">{toolbarEnd}</div>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="text-foreground-secondary text-sm">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const { id, ...row } = item;
            return (
              <li key={id} className="min-w-0 list-none">
                <AmbientTrackRow {...row} density={density} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
