import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Select } from '@tahti-player/ui';

import {
  fetchFallbackCollections,
  setFallbackCollection,
  type FallbackCollectionOption,
} from '../api/fallback-collection';
import { StudioPanel } from './StudioPanel';

const DEFAULT_SOURCE = '';

/** Where the 24/7 rotation takes its tracks from: the tracks marked for
 * rotation (default) or one of the channel owner's collections. */
export function RotationSourcePicker({ slug }: { slug: string }) {
  const [options, setOptions] = useState<FallbackCollectionOption[] | null>(
    null,
  );
  const [selected, setSelected] = useState(DEFAULT_SOURCE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchFallbackCollections(slug).then((result) => {
      if (cancelled || !result.data) {
        return;
      }
      setOptions(result.data);
      setSelected(
        result.data.find((option) => option.active)?.id ?? DEFAULT_SOURCE,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!options || options.length === 0) {
    return null;
  }

  const change = async (value: string) => {
    const previous = selected;
    setSelected(value);
    setSaving(true);
    const result = await setFallbackCollection(slug, value || null);
    setSaving(false);
    if (!result.ok) {
      setSelected(previous);
      toast.error(result.error);
      return;
    }
    toast.success('Rotation source saved.');
  };

  return (
    <StudioPanel
      title="Rotation source"
      description="Play the 24/7 rotation from one of your collections instead of the tracks you marked for rotation."
    >
      <div className="sm:max-w-sm">
        <Select
          label="Play from"
          value={selected}
          disabled={saving}
          onValueChange={(value) => void change(value)}
          options={[
            { id: DEFAULT_SOURCE, label: 'Tracks marked for rotation' },
            ...options.map((option) => ({
              id: option.id,
              label: `${option.name} (${option.trackCount} ${option.trackCount === 1 ? 'track' : 'tracks'})`,
            })),
          ]}
        />
      </div>
    </StudioPanel>
  );
}
