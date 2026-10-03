import { useEffect, useState } from 'react';

import { Select } from '@tahti-player/ui';

import { fetchVenues } from '../../api/client';
import type { StudioSound } from '../../api/studio-types';
import { fetchMyVenues } from '../../api/venues-manage';

export type VenueOption = { id: string; label: string };

const NONE = '';

function label(venue: { name: string; city?: string | null }): string {
  return venue.city ? `${venue.name} · ${venue.city}` : venue.name;
}

/** Verified venues plus the artist's own (which may still await
 * verification), deduped and sorted, keeping the track's current venue even
 * when neither list returns it. */
export function venueOptions(
  lists: Array<Array<{ id: string; name: string; city?: string | null }>>,
  current: StudioSound['venue'],
): VenueOption[] {
  const byId = new Map<string, VenueOption>();
  for (const venue of lists.flat()) {
    byId.set(venue.id, { id: venue.id, label: label(venue) });
  }
  if (current && !byId.has(current.id)) {
    byId.set(current.id, { id: current.id, label: label(current) });
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

/** Structured "Recorded at" for a track (Sound.venueId). The venue shows on
 * the public track page once it is verified. */
export function RecordedAtVenuePicker({
  value,
  current,
  onChange,
}: {
  value: string | null;
  current: StudioSound['venue'];
  onChange: (venueId: string | null) => void;
}) {
  const [options, setOptions] = useState<VenueOption[]>(() =>
    venueOptions([], current),
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([fetchVenues(), fetchMyVenues()]).then(
      ([publicVenues, myVenues]) => {
        if (!cancelled) {
          setOptions(venueOptions([publicVenues.data, myVenues.data], current));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [current]);

  return (
    <div className="sm:max-w-xs">
      <Select
        label="Recorded at (optional)"
        description="Shown on the track page, linking to the venue."
        value={value ?? NONE}
        onValueChange={(next) => onChange(next === NONE ? null : next)}
        options={[{ id: NONE, label: 'No venue' }, ...options]}
      />
    </div>
  );
}
