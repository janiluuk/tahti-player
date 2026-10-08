import { Button } from '@tahti-player/ui';

import { HEADER_STYLES, type HeaderStyle } from '../../api/channel-design';

export const HEADER_DESIGN_OPTIONS = [
  ...HEADER_STYLES,
  'SLIDESHOW',
  'VISUALIZATION',
] as const;
export type HeaderDesignMode = (typeof HEADER_DESIGN_OPTIONS)[number];

type Props = {
  value: HeaderDesignMode;
  onChange: (mode: HeaderDesignMode) => void;
};

function labelFor(mode: HeaderDesignMode): string {
  if (mode === 'SLIDESHOW') {
    return 'Slideshow';
  }
  if (mode === 'VIDEO_LOOP') {
    return 'Video / image';
  }
  if (mode === 'VISUALIZATION') {
    return 'Visualization';
  }
  return mode.replace(/_/g, ' ');
}

/** Segmented Gradient / Solid / Video / Slideshow / Visualization control. */
export function HeaderStyleTabs({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Header style"
      className="border-border flex flex-wrap gap-1 rounded-lg border p-1"
    >
      {HEADER_DESIGN_OPTIONS.map((mode) => {
        const selected = value === mode;
        return (
          <Button
            variant="plain"
            size="flexible"
            key={mode}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(mode)}
            className={`inline-block rounded-md px-2.5 py-1.5 text-[10px] font-semibold tracking-wide whitespace-normal uppercase active:scale-100 ${
              selected
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {labelFor(mode)}
          </Button>
        );
      })}
    </div>
  );
}

export function resolveHeaderDesignMode(
  headerStyle: string,
  slideshowSelected: boolean,
): HeaderDesignMode {
  if (slideshowSelected) {
    return 'SLIDESHOW';
  }
  if (headerStyle === 'VISUALIZATION') {
    return 'VISUALIZATION';
  }
  if ((HEADER_STYLES as readonly string[]).includes(headerStyle)) {
    return headerStyle as HeaderStyle;
  }
  return 'GRADIENT';
}
