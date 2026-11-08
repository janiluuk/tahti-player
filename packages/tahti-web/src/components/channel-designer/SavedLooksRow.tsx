import { Trash2Icon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import type { ChannelVisualPreset } from '../../api/channel-design';
import { PageError } from '../PageStates';

type Props = {
  presets: ChannelVisualPreset[];
  loadError?: string | null;
  onRetry?: () => void;
  presetBusy: boolean;
  onApply: (preset: ChannelVisualPreset) => void;
  onRequestDelete: (preset: ChannelVisualPreset) => void;
};

/** Saved-look chip row shown above the preview once at least one preset
 * exists. */
export function SavedLooksRow({
  presets,
  loadError,
  onRetry,
  presetBusy,
  onApply,
  onRequestDelete,
}: Props) {
  const { t } = useTranslation('web');
  if (loadError && presets.length === 0) {
    return (
      <PageError
        title={t('loadErrors.couldNotLoadYourSavedLooks')}
        description={loadError}
        onRetry={onRetry}
      />
    );
  }
  if (presets.length === 0) {
    return null;
  }
  return (
    <div className="border-border bg-background-secondary/30 flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        {t('savedLooksRow.savedLooks')}
      </span>
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="border-border bg-background flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
        >
          <Button
            variant="plain"
            size="flexible"
            type="button"
            className="hover:text-primary-strong inline-block rounded-none font-semibold whitespace-normal active:scale-100"
            disabled={presetBusy}
            onClick={() => onApply(preset)}
          >
            {preset.name}
          </Button>
          <Tooltip content={t('savedLooksRow.deletePreset')}>
            <Button
              variant="plain"
              size="flexible"
              type="button"
              aria-label={`Delete "${preset.name}"`}
              className="text-foreground-secondary hover:text-accent-red-strong inline-block rounded-full p-1.5 whitespace-normal active:scale-100"
              disabled={presetBusy}
              onClick={() => onRequestDelete(preset)}
            >
              <Trash2Icon className="text-accent-red" size={14} />
            </Button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
