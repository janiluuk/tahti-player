import { ColorField } from '@tahti-player/ui';

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
        <ColorField
          key={key}
          compact
          label={label}
          value={scheme[key] ?? DEFAULT_COLOR_SCHEME[key]}
          onChange={(next) => onChange({ ...scheme, [key]: next })}
        />
      ))}
    </div>
  );
}
