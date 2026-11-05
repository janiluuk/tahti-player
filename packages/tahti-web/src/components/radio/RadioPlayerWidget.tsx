import type { ReactNode } from 'react';

import { Box, Tabs, type TabsItem } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import { RadioVisualizerHero } from './RadioVisualizerHero';

/** On-air player + Up next / Shows / Just played / Featured in one surface. */
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
}) {
  return (
    <Box
      variant="secondary"
      className="flex flex-col overflow-hidden rounded-xl p-0"
      data-testid="radio-player-widget"
    >
      {online ? (
        <RadioVisualizerHero
          station={station}
          logoUrl={logoUrl}
          info={info}
          actions={actions}
          embedded
        />
      ) : (
        <div className="p-4 sm:p-6" data-testid="radio-player-widget-offline">
          {offlineContent}
        </div>
      )}
      {notice}
      <div className="border-border border-t px-3 pt-1 pb-3 sm:px-4 sm:pb-4">
        <Tabs
          listClassName="border-border border-b"
          panelClassName="pt-3"
          selectedIndex={selectedTabIndex}
          onChange={onTabChange}
          items={tabs}
        />
      </div>
    </Box>
  );
}
