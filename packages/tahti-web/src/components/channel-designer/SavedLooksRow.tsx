import { Trash2Icon } from 'lucide-react';

import { Tooltip } from '@tahti-player/ui';

import type { ChannelVisualPreset } from '../../api/channel-design';

type Props = {
  presets: ChannelVisualPreset[];
  presetBusy: boolean;
  onApply: (preset: ChannelVisualPreset) => void;
  onRequestDelete: (preset: ChannelVisualPreset) => void;
};

/** Saved-look chip row shown above the preview once at least one preset
 * exists. */
export function SavedLooksRow({
  presets,
  presetBusy,
  onApply,
  onRequestDelete,
}: Props) {
  if (presets.length === 0) {
    return null;
  }
  return (
    <div className="border-border bg-background-secondary/30 flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <span className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
        Saved looks
      </span>
      {presets.map((preset) => (
        <div
          key={preset.id}
          className="border-border bg-background flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
        >
          <button
            type="button"
            className="hover:text-primary font-semibold"
            disabled={presetBusy}
            onClick={() => onApply(preset)}
          >
            {preset.name}
          </button>
          <Tooltip content="Delete preset">
            <button
              type="button"
              aria-label={`Delete "${preset.name}"`}
              className="text-foreground-secondary hover:text-accent-red rounded-full p-1.5"
              disabled={presetBusy}
              onClick={() => onRequestDelete(preset)}
            >
              <Trash2Icon size={14} />
            </button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
