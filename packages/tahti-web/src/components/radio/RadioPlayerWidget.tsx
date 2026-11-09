import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, Tabs, Tooltip, type TabsItem } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { useDominantColor } from '../../lib/useDominantColor';
import {
  RadioVisualizerHero,
  type RadioHeroLiveChannel,
} from './RadioVisualizerHero';

const AMBIENT_FALLBACK = '12 12 16';
const AMBIENT_DARKEN = 0.55;

export function radioAmbient(rgb: [number, number, number] | null): string {
  if (!rgb) {
    return AMBIENT_FALLBACK;
  }
  return rgb.map((c) => Math.round(c * AMBIENT_DARKEN)).join(' ');
}

/** On-air player + Up next / Shows / Just played / Featured in one surface.
 * Starts minimized (a short now-playing strip); the corner button expands it
 * to the full visualizer and tabs. The playing track's cover sets
 * `--radio-ambient`, which tints the scrim. Play sits in the top-right
 * corner next to the expand toggle, as on the track page. */
export function RadioPlayerWidget({
  station,
  logoUrl,
  artworkUrl = null,
  liveChannel = null,
  online,
  offlineContent,
  info,
  actions,
  playControl,
  notice,
  tabs,
  selectedTabIndex,
  onTabChange,
  defaultExpanded = false,
}: {
  station: PublicChannel;
  logoUrl: string | null;
  artworkUrl?: string | null;
  /** A member channel relayed on air; its artwork replaces the station logo. */
  liveChannel?: RadioHeroLiveChannel | null;
  online: boolean;
  offlineContent?: ReactNode;
  info: ReactNode;
  actions: ReactNode;
  playControl?: ReactNode;
  notice?: ReactNode;
  tabs: TabsItem[];
  selectedTabIndex: number;
  onTabChange: (index: number) => void;
  defaultExpanded?: boolean;
}) {
  const { t } = useTranslation('web');
  const [expanded, setExpanded] = useState(defaultExpanded);
  const toggleLabel = expanded
    ? t('radio.minimizePlayer')
    : t('radio.expandPlayer');
  const ToggleIcon = expanded ? ChevronUpIcon : ChevronDownIcon;
  const ambient = radioAmbient(useDominantColor(artworkUrl));

  return (
    <div className="relative pb-4">
      <Box
        variant="secondary"
        className="relative flex flex-col overflow-hidden rounded-xl p-0"
        data-testid="radio-player-widget"
        data-expanded={expanded}
        style={{ '--radio-ambient': ambient } as CSSProperties}
      >
        {online ? (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            {playControl}
          </div>
        ) : null}
        {online ? (
          <RadioVisualizerHero
            station={station}
            logoUrl={logoUrl}
            artworkUrl={artworkUrl}
            liveChannel={liveChannel}
            info={info}
            actions={actions}
            embedded
            compact={!expanded}
          />
        ) : (
          <div className="p-4 sm:p-6" data-testid="radio-player-widget-offline">
            {offlineContent}
          </div>
        )}
        {notice}
        {expanded ? (
          <div className="border-border border-t px-3 pt-1 pb-3 sm:px-4 sm:pb-4">
            <Tabs
              listClassName="border-border border-b"
              panelClassName="pt-3"
              selectedIndex={selectedTabIndex}
              onChange={onTabChange}
              items={tabs}
            />
          </div>
        ) : null}
      </Box>
      <Tooltip content={toggleLabel} side="bottom">
        <Button
          size="flexible"
          variant="plain"
          data-testid="radio-player-widget-toggle"
          aria-label={toggleLabel}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="border-border bg-background text-foreground-secondary hover:text-foreground focus-visible:ring-focus-ring absolute bottom-0 left-1/2 z-20 inline-flex h-7 w-12 -translate-x-1/2 items-center justify-center rounded-full border p-0 shadow-sm transition-colors focus-visible:ring-2 active:scale-100"
        >
          <ToggleIcon size={16} aria-hidden />
        </Button>
      </Tooltip>
    </div>
  );
}
