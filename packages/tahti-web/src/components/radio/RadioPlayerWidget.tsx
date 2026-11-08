import { Maximize2, Minimize2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Box, Button, Tabs, Tooltip, type TabsItem } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { RadioVisualizerHero } from './RadioVisualizerHero';

/** On-air player + Up next / Shows / Just played / Featured in one surface.
 * Starts minimized (a short now-playing strip); the corner button expands it
 * to the full visualizer and tabs. */
export function RadioPlayerWidget({
  station,
  logoUrl,
  online,
  offlineContent,
  info,
  actions,
  notice,
  tabs,
  selectedTabIndex,
  onTabChange,
  defaultExpanded = false,
}: {
  station: PublicChannel;
  logoUrl: string | null;
  online: boolean;
  offlineContent?: ReactNode;
  info: ReactNode;
  actions: ReactNode;
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
  const ToggleIcon = expanded ? Minimize2 : Maximize2;

  return (
    <Box
      variant="secondary"
      className="relative flex flex-col overflow-hidden rounded-xl p-0"
      data-testid="radio-player-widget"
      data-expanded={expanded}
    >
      <div className="absolute top-3 right-3 z-20">
        <Tooltip content={toggleLabel} side="left">
          <Button
            size="icon"
            variant="secondary"
            data-testid="radio-player-widget-toggle"
            aria-label={toggleLabel}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <ToggleIcon size={16} aria-hidden />
          </Button>
        </Tooltip>
      </div>
      {online ? (
        <RadioVisualizerHero
          station={station}
          logoUrl={logoUrl}
          info={info}
          actions={actions}
          embedded
          compact={!expanded}
        />
      ) : (
        <div
          className="p-4 pr-14 sm:p-6 sm:pr-16"
          data-testid="radio-player-widget-offline"
        >
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
  );
}
