import { CircleDotIcon, InfoIcon, ListMusicIcon, PlusIcon } from 'lucide-react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  EditIconButton,
  TabLabel,
  Tabs,
  Tooltip,
} from '@tahti-player/ui';

import type { StudioShowSeries } from '../../../api/shows';
import { EntitySocialHeader } from '../../../components/EntitySocialHeader';
import type { ShowDetailState } from './useShowDetail';

export function ShowHeader({
  show,
  state,
  editing,
  onEditingChange,
}: {
  show: StudioShowSeries;
  state: ShowDetailState;
  editing: boolean;
  onEditingChange: (next: boolean) => void;
}) {
  const { t } = useTranslation('web');
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
        subtitle={`${show.showType === 'LIVE_SET' ? t('showHeaderStates.liveSet') : t('showHeaderStates.talkShow')} · ${show.mode === 'SINGLE' ? t('showHeaderStates.singleShow') : t('showHeaderStates.series')}`}
        description={description.trim() || undefined}
        actions={
          <>
            {show.mode === 'SINGLE' ? null : (
              <Tooltip content={t('showHeader.newEpisode')} side="top">
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="bg-background border-border rounded-md border-(length:--border-width)"
                  onClick={() => setCreateOpen(true)}
                  aria-label={t('showHeader.newEpisode')}
                >
                  <PlusIcon size={16} aria-hidden />
                </Button>
              </Tooltip>
            )}
            <EditIconButton
              label={t('showHeader.editDetails')}
              editing={editing}
              onClick={() => onEditingChange(!editing)}
            />
          </>
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
        <Tabs.List aria-label={t('showHeader.showSections')}>
          <Tabs.Tab>
            <TabLabel icon={<InfoIcon size={14} />}>
              {t('showHeader.overview')}
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel
              icon={<ListMusicIcon size={14} />}
              count={episodes.length}
            >
              {t('showHeader.episodes')}
            </TabLabel>
          </Tabs.Tab>
          <Tabs.Tab>
            <TabLabel icon={<CircleDotIcon size={14} />} count={recordingCount}>
              {t('showHeader.recordings')}
            </TabLabel>
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
    </>
  );
}
