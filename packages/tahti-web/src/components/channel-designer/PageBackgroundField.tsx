import { Input } from '@tahti-player/ui';

import {
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from '../../api/channel-design';

type Props = {
  scheme: ColorScheme;
  backgroundScheme: ColorScheme;
  useBackgroundGradient: boolean;
  onChange: (bg: string) => void;
};

/** Always-visible page background swatch at the top of Backdrop Look. */
export function PageBackgroundField({
  scheme,
  backgroundScheme,
  useBackgroundGradient,
  onChange,
}: Props) {
  const value = useBackgroundGradient
    ? (backgroundScheme.bg ?? scheme.bg ?? DEFAULT_COLOR_SCHEME.bg)
    : (scheme.bg ?? DEFAULT_COLOR_SCHEME.bg);

  return (
    <label className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-lg border p-2.5 text-sm">
      <Input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Page background color"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">Page background</span>
        <code className="text-foreground-secondary text-xs">{value}</code>
      </span>
    </label>
  );
}
