import { Tabs } from '@tahti-player/ui';

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

export function HeaderStyleTabs({ value, onChange }: Props) {
  const selectedIndex = Math.max(0, HEADER_DESIGN_OPTIONS.indexOf(value));

  return (
    <Tabs.Root
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const mode = HEADER_DESIGN_OPTIONS[index];
        if (mode) {
          onChange(mode);
        }
      }}
      className="gap-0"
      listClassName="border-border flex w-auto flex-wrap gap-1 rounded-lg border p-1"
      tabClassName="rounded-md px-2.5 py-1.5 text-[10px] font-semibold tracking-wide whitespace-normal uppercase active:scale-100"
    >
      <Tabs.List aria-label="Header style">
        {HEADER_DESIGN_OPTIONS.map((mode) => (
          <Tabs.Tab key={mode}>{labelFor(mode)}</Tabs.Tab>
        ))}
      </Tabs.List>
    </Tabs.Root>
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
