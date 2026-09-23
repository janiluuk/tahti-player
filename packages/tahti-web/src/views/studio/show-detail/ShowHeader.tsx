import { CircleDotIcon, InfoIcon, ListMusicIcon, PlusIcon } from 'lucide-react';

import { Button, TabLabel, Tabs, Tooltip } from '@tahti-player/ui';

import type { StudioShowSeries } from '../../../api/shows';
import { EntitySocialHeader } from '../../../components/EntitySocialHeader';
import type { ShowDetailState } from './useShowDetail';

export function ShowHeader({
  show,
  state,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
}) {
  const {
    thumbnailUrl,
    backdropUrl,
    description,
    setCreateOpen,
    showTab,
    setShowTab,
    episodes,
    recordingCount,
  } = state;

  return (
    <>
      <EntitySocialHeader
        title={show.title}
        imageUrl={thumbnailUrl}
        imageAlt=""
        backdropUrl={backdropUrl}
        subtitle={`${show.showType === 'LIVE_SET' ? 'Live set' : 'Talk show'} · ${show.mode === 'SINGLE' ? 'Single show' : 'Series'}`}
        description={description.trim() || undefined}
        actions={
          show.mode === 'SINGLE' ? undefined : (
            <Tooltip content="New episode" side="top">
              <Button
                variant="secondary"
                size="icon-sm"
                className="bg-background border-border rounded-md border-(length:--border-width)"
                onClick={() => setCreateOpen(true)}
                aria-label="New episode"
              >
                <PlusIcon size={16} aria-hidden />
              </Button>
            </Tooltip>
          )
        }
        data-testid="studio-show-social-header"
      />

      <Tabs.Root
        selectedIndex={
          showTab === 'episodes' ? 1 : showTab === 'recordings' ? 2 : 0
        }
        onChange={(index) => {
          setShowTab(
            index === 1 ? 'episodes' : index === 2 ? 'recordings' : 'overview',
          );
        }}
      >
        <Tabs.List aria-label="Show sections">
          <Tabs.Tab>
            <TabLabel icon={<InfoIcon size={14} />}>Overview</TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel
              icon={<ListMusicIcon size={14} />}
              count={episodes.length}
            >
              Episodes
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel icon={<CircleDotIcon size={14} />} count={recordingCount}>
              Recordings
            </TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
    </>
  );
}
