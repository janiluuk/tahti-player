import { Input } from '@tahti-player/ui';

import {
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from '../../api/channel-design';

type Props = {
  scheme: ColorScheme;
  onChange: (next: ColorScheme) => void;
};

/** Compact accent + highlight pickers for Solid / Video / Slideshow modes. */
export function AccentPairFields({ scheme, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(
        [
          ['accent', 'Accent'],
          ['highlight', 'Highlight'],
        ] as const
      ).map(([key, label]) => (
        <label
          key={key}
          className="border-border bg-background-secondary/40 flex items-center gap-2 rounded-lg border p-2 text-sm"
        >
          <Input
            type="color"
            value={scheme[key] ?? DEFAULT_COLOR_SCHEME[key]}
            onChange={(event) =>
              onChange({ ...scheme, [key]: event.target.value })
            }
            className="h-8 w-9"
            aria-label={label}
          />
          <span className="min-w-0 truncate text-xs font-semibold">
            {label}
          </span>
        </label>
      ))}
    </div>
  );
}
