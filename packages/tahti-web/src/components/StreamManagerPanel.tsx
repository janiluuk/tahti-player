import { BarChart3Icon, ListMusicIcon } from 'lucide-react';

import { TabLabel, Tabs } from '@tahti-player/ui';

import { ManagerDialogs } from './stream-manager/ManagerDialogs';
import { PanelHeader } from './stream-manager/PanelHeader';
import { PlaylistDialog } from './stream-manager/PlaylistDialog';
import { RotationBody } from './stream-manager/RotationBody';
import { StatsGrid } from './stream-manager/StatsGrid';
import { useStreamManagerState } from './stream-manager/useStreamManagerState';

export function StreamManagerPanel({
  slug,
  channelState,
  isPlaying = false,
  onPlaybackToggle,
  onEnded,
  onRotationChange,
  readOnly = false,
  defaultExpanded = false,
}: {
  slug: string;
  channelState: string;
  isPlaying?: boolean;
  onPlaybackToggle?: () => void;
  onEnded?: () => void;
  onRotationChange?: (playing: boolean) => void;
  readOnly?: boolean;
  defaultExpanded?: boolean;
}) {
  const state = useStreamManagerState({
    slug,
    channelState,
    isPlaying,
    onEnded,
    onRotationChange,
    readOnly,
    defaultExpanded,
  });
  const {
    canControl,
    rotationPlaying,
    rotationExpanded,
    activeTab,
    setActiveTab,
    rotationMsg,
    error,
  } = state;

  return (
    <section className="border-border bg-background-secondary/40 flex flex-col gap-4 rounded-xl border p-5 shadow-sm sm:p-6">
      <PanelHeader state={state} onPlaybackToggle={onPlaybackToggle} />

      {rotationMsg && (
        <p className="text-foreground-secondary text-xs" role="status">
          {rotationMsg}
        </p>
      )}

      {(!rotationPlaying || rotationExpanded) && (
        <Tabs.Root
          selectedIndex={activeTab === 'rotation' ? 0 : 1}
          onChange={(index) => setActiveTab(index === 0 ? 'rotation' : 'stats')}
        >
          <Tabs.List>
            <Tabs.Tab>
              <TabLabel icon={<ListMusicIcon size={14} />}>
                Active rotation
              </TabLabel>
            </Tabs.Tab>
            <Tabs.Tab>
              <TabLabel icon={<BarChart3Icon size={14} />}>
                Stream stats
              </TabLabel>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      )}

      {activeTab === 'stats' && (!rotationPlaying || rotationExpanded) && (
        <StatsGrid state={state} />
      )}

      {activeTab === 'rotation' && <RotationBody state={state} />}

      {canControl ? <ManagerDialogs state={state} /> : null}

      {error && <p className="text-accent-red text-xs">{error}</p>}

      {canControl ? <PlaylistDialog state={state} /> : null}
    </section>
  );
}
