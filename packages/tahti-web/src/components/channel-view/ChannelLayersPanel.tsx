import type { RefObject } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { FilterChips, Toggle } from '@tahti-player/ui';

import type { ChannelLink } from '../../api/channel-design';
import type { PublicChannel } from '../../api/types';
import {
  channelLookElements,
  type ChannelLookElementId,
} from '../../lib/channelLookElements';
import {
  addPlaylistItem,
  BACKDROP_FOLDED_ITEM_TYPES,
  CHANNEL_PAGE_ITEM_META,
  feedFilterOptions,
  moveItem,
  setFeedDisplay,
  setFeedFilters,
  setItemVisible,
  setItemWidth,
  setNavigationTabs,
  setPlaylistDisplay,
  setPlaylistSlug,
  type ChannelLayoutPresetId,
  type ChannelLookBundle,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../../lib/channelPageLayout';
import {
  ChannelDesigner,
  type ChannelDesignerHandle,
} from '../ChannelDesigner';
import { ChannelLayersMenu } from '../ChannelLayersMenu';
import { ChannelLinksEditor } from '../ChannelLinksEditor';
import { ChannelNavigationEditor } from '../ChannelNavigationEditor';
import { ChannelPlaylistPicker } from '../ChannelPlaylistPicker';

type UpdateLayout = (
  updater: ChannelPageItem[] | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
) => void;

type Props = {
  channel: PublicChannel;
  slug: string;
  layout: ChannelPageItem[];
  updateLayout: UpdateLayout;
  removeLayoutItem: (id: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activePresetId: ChannelLayoutPresetId | null;
  onApplyPreset: (id: ChannelLayoutPresetId) => void;
  embedItems: {
    id: string;
    label: string;
    hint: string;
    embedInstanceId: string;
  }[];
  links: ChannelLink[];
  onLinksChange: (links: ChannelLink[]) => void;
  designerRef: RefObject<ChannelDesignerHandle>;
  presetLook: { token: number; look: ChannelLookBundle } | null;
  lookTick: number;
  onLookDirtyChange: (dirty: boolean) => void;
  onLookBusyChange?: (busy: boolean) => void;
  onLookSaved: () => void;
};

/** The editing side panel: the layer list plus, for the selected layer, its
 * own controls (links, playlist, feed, navigation, or the look designer). */
export function ChannelLayersPanel({
  channel,
  slug,
  layout,
  updateLayout,
  removeLayoutItem,
  selectedId,
  onSelect,
  activePresetId,
  onApplyPreset,
  embedItems,
  links,
  onLinksChange,
  designerRef,
  presetLook,
  lookTick,
  onLookDirtyChange,
  onLookBusyChange,
  onLookSaved,
}: Props) {
  const { t } = useTranslation('web');
  const selectedType =
    selectedId === 'header'
      ? 'header'
      : layout.find((i) => i.id === selectedId)?.type;

  const lookElementId: ChannelLookElementId | null =
    selectedType === 'hero'
      ? 'player'
      : selectedType === 'header'
        ? 'backdrop'
        : selectedType === 'events'
          ? 'shows'
          : selectedType === 'sound'
            ? 'tracks'
            : null;
  const lookOpenSection =
    selectedType === 'links'
      ? 'links'
      : selectedType === 'playlist'
        ? 'playlist'
        : selectedType === 'navigation'
          ? 'navigation'
          : selectedType === 'feed'
            ? 'feed'
            : lookElementId;

  const selectedPlaylistItem =
    selectedType === 'playlist'
      ? layout.find((item) => item.id === selectedId)
      : undefined;

  const selectedFeedItem =
    selectedType === 'feed'
      ? layout.find((item) => item.id === selectedId)
      : undefined;

  const selectedNavigationItem =
    selectedType === 'navigation'
      ? layout.find((item) => item.id === selectedId)
      : undefined;

  return (
    <ChannelLayersMenu
      items={layout.filter(
        (item) =>
          !BACKDROP_FOLDED_ITEM_TYPES.includes(
            item.type as ChannelPageItemType,
          ),
      )}
      selectedId={selectedId}
      lookOpenSection={lookOpenSection}
      activePresetId={activePresetId}
      onSelect={onSelect}
      onResize={(id, width) => {
        updateLayout((prev) => setItemWidth(prev, id, width));
      }}
      onRemove={(id) => removeLayoutItem(id)}
      embedItems={embedItems}
      onAddEmbed={(embedInstanceId) => {
        updateLayout((prev) => {
          const existing = prev.find(
            (i) => i.type === 'embed' && i.embedInstanceId === embedInstanceId,
          );
          if (existing) {
            return setItemVisible(prev, existing.id, true);
          }
          return [
            ...prev,
            {
              id: `embed-${embedInstanceId}`,
              type: 'embed',
              embedInstanceId,
              visible: true,
            },
          ];
        });
      }}
      onAddPlaylist={(playlistSlug) => {
        updateLayout((prev) => addPlaylistItem(prev, playlistSlug));
      }}
      onReorder={(fromId, toId) => {
        updateLayout((prev) => moveItem(prev, fromId, toId));
      }}
      onApplyPreset={onApplyPreset}
      lookSlot={
        <>
          <div
            className={
              ['links', 'playlist', 'feed', 'navigation'].includes(
                lookOpenSection ?? '',
              )
                ? 'hidden'
                : 'flex min-h-0 flex-1 flex-col'
            }
          >
            <ChannelDesigner
              ref={designerRef}
              lookOnly
              lookElementIds={channelLookElements(t)
                .filter(
                  (element) =>
                    element.id === 'backdrop' ||
                    layout.some((item) => item.type === element.layoutType),
                )
                .map((element) => element.id)}
              onLookSelect={(id) =>
                onSelect(
                  id === 'backdrop'
                    ? 'header'
                    : (layout.find(
                        (item) =>
                          item.type ===
                          channelLookElements(t).find(
                            (element) => element.id === id,
                          )?.layoutType,
                      )?.id ?? null),
                )
              }
              presetLook={presetLook}
              reloadToken={lookTick}
              displayName={channel.user.displayName}
              username={channel.user.username}
              channelSlug={slug}
              avatarUrl={channel.user.avatarUrl}
              bio={channel.user.bio}
              layout={layout}
              onLayoutChange={(updater) => updateLayout(updater)}
              lookOpenSection={lookElementId}
              onDirtyChange={onLookDirtyChange}
              onBusyChange={onLookBusyChange}
              onSaved={onLookSaved}
            />
          </div>
          {lookOpenSection === 'links' ? (
            <ChannelLinksEditor links={links} onChange={onLinksChange} />
          ) : lookOpenSection === 'playlist' && selectedPlaylistItem ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  {t('channelLayersPanel.chooseWhichPlaylistThisBlock')}
                </p>
                <ChannelPlaylistPicker
                  usedSlugs={layout
                    .filter(
                      (item) => item.type === 'playlist' && item.playlistSlug,
                    )
                    .map((item) => item.playlistSlug as string)}
                  initialSlug={selectedPlaylistItem.playlistSlug}
                  applyOnChange
                  onPick={(playlistSlug) => {
                    updateLayout((prev) =>
                      setPlaylistSlug(
                        prev,
                        selectedPlaylistItem.id,
                        playlistSlug,
                      ),
                    );
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  {t('channelLayersPanel.howTracksAppearOnThe')}
                </p>
                <FilterChips
                  items={[
                    {
                      id: 'tracklist',
                      label: t('channelLayersPanelMore.tracklist'),
                    },
                    { id: 'cards', label: t('channelLayersPanelMore.cards') },
                  ]}
                  selected={selectedPlaylistItem.playlistDisplay ?? 'tracklist'}
                  onChange={(id) => {
                    if (id !== 'tracklist' && id !== 'cards') {
                      return;
                    }
                    updateLayout((prev) =>
                      setPlaylistDisplay(prev, selectedPlaylistItem.id, id),
                    );
                  }}
                  aria-label={t('channelLayersPanel.playlistDisplay')}
                />
              </div>
            </div>
          ) : lookOpenSection === 'feed' && selectedFeedItem ? (
            <div className="flex flex-col gap-3">
              <p className="text-foreground-secondary text-xs">
                {t('channelLayersPanel.feedHasNoLiveUpdate')}
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  {t('channelLayersPanel.whichUpdateTypesToInclude')}
                </p>
                <div className="flex flex-col gap-2">
                  {feedFilterOptions(t).map((option) => {
                    const filters = selectedFeedItem.feedFilters ?? [];
                    const checked =
                      filters.length === 0 || filters.includes(option.id);
                    return (
                      <div
                        key={option.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span>{option.label}</span>
                        <Toggle
                          label={option.label}
                          checked={checked}
                          onChange={(next) => {
                            const current =
                              filters.length === 0
                                ? feedFilterOptions(t).map((o) => o.id)
                                : filters;
                            const nextFilters = next
                              ? [...new Set([...current, option.id])]
                              : current.filter((id) => id !== option.id);
                            updateLayout((prev) =>
                              setFeedFilters(
                                prev,
                                selectedFeedItem.id,
                                nextFilters,
                              ),
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-foreground-secondary text-xs">
                  {t('channelLayersPanel.howUpdatesAppearOnThe')}
                </p>
                <FilterChips
                  items={[
                    {
                      id: 'tracklist',
                      label: t('channelLayersPanelMore.tracklist'),
                    },
                    { id: 'cards', label: t('channelLayersPanelMore.cards') },
                    { id: 'both', label: t('channelLayersPanelMore.both') },
                  ]}
                  selected={selectedFeedItem.feedDisplay ?? 'tracklist'}
                  onChange={(id) => {
                    if (id !== 'tracklist' && id !== 'cards' && id !== 'both') {
                      return;
                    }
                    updateLayout((prev) =>
                      setFeedDisplay(prev, selectedFeedItem.id, id),
                    );
                  }}
                  aria-label={t('channelLayersPanel.feedDisplay')}
                />
              </div>
            </div>
          ) : lookOpenSection === 'navigation' && selectedNavigationItem ? (
            <ChannelNavigationEditor
              tabs={selectedNavigationItem.navigationTabs ?? []}
              candidateItems={layout
                .filter(
                  (candidate) =>
                    candidate.visible &&
                    candidate.type !== 'hero' &&
                    candidate.type !== 'chat' &&
                    candidate.type !== 'navigation' &&
                    !BACKDROP_FOLDED_ITEM_TYPES.includes(
                      candidate.type as ChannelPageItemType,
                    ),
                )
                .map((candidate) => ({
                  id: candidate.id,
                  label:
                    candidate.type === 'playlist' && candidate.playlistSlug
                      ? candidate.playlistSlug
                      : CHANNEL_PAGE_ITEM_META[candidate.type].label,
                }))}
              onChange={(tabs) => {
                updateLayout((prev) =>
                  setNavigationTabs(prev, selectedNavigationItem.id, tabs),
                );
              }}
            />
          ) : null}
        </>
      }
    />
  );
}
