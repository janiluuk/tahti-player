import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@tahti-player/i18n';
import { Select } from '@tahti-player/ui';

import {
  fetchFallbackCollections,
  setFallbackCollection,
  type FallbackCollectionOption,
} from '../api/fallback-collection';
import { StudioPanel } from './StudioPanel';

const DEFAULT_SOURCE = '';

export function RotationSourcePicker({ slug }: { slug: string }) {
  const { t } = useTranslation('web');
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
    toast.success(t('toasts.rotationSourceSaved'));
  };

  return (
    <StudioPanel
      title={t('rotationSource.title')}
      description={t('rotationSource.description')}
    >
      <div className="sm:max-w-sm">
        <Select
          label={t('rotationSource.playFrom')}
          value={selected}
          disabled={saving}
          onValueChange={(value) => void change(value)}
          options={[
            { id: DEFAULT_SOURCE, label: t('rotationSource.markedTracks') },
            ...options.map((option) => ({
              id: option.id,
              label: `${option.name} (${t('rotationSource.tracks', { count: option.trackCount })})`,
            })),
          ]}
        />
      </div>
    </StudioPanel>
  );
}
