import {
  DEFAULT_COLOR_SCHEME,
  type ColorScheme,
} from '../../api/channel-design';

const FIELD_LABELS = {
  // The player's own waveform seekbar — accurate only where this
  // component styles the player, not the header/page background.
  player: {
    accent: 'Accent / waveform played',
    highlight: 'Highlight',
    bg: 'Background',
    text: 'Foreground',
    muted: 'Muted / waveform unplayed',
  },
  generic: {
    accent: 'Accent',
    highlight: 'Highlight',
    bg: 'Background',
    text: 'Foreground',
    muted: 'Muted',
  },
} as const;

const FIELD_ORDER = ['accent', 'highlight', 'bg', 'text', 'muted'] as const;

type Props = {
  scheme: ColorScheme;
  onChange: (next: ColorScheme) => void;
  /** `player` (default) labels these as the waveform seekbar colors they
   * are in that context; `generic` drops the waveform wording for the
   * header/page-background contexts, where it doesn't apply. */
  variant?: keyof typeof FIELD_LABELS;
};

/** Shared 5-swatch color pickers for header, player, and page palettes. */
export function ColorSchemeFields({
  scheme,
  onChange,
  variant = 'player',
}: Props) {
  const labels = FIELD_LABELS[variant];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELD_ORDER.map((key) => {
        const label = labels[key];
        return (
          <label
            key={key}
            className="border-border bg-background-secondary/40 flex items-center gap-3 rounded-lg border p-3 text-sm"
          >
            <input
              type="color"
              value={scheme[key] ?? DEFAULT_COLOR_SCHEME[key]}
              onChange={(event) =>
                onChange({ ...scheme, [key]: event.target.value })
              }
              className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <code className="text-foreground-secondary text-xs">
                {scheme[key]}
              </code>
            </span>
          </label>
        );
      })}
    </div>
  );
}
