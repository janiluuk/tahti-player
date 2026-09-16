import {
  EyeIcon,
  EyeOffIcon,
  GripVerticalIcon,
  ImageIcon,
  LayoutTemplateIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button, Tooltip } from '@tahti-player/ui';

import {
  BACKDROP_FOLDED_ITEM_TYPES,
  CHANNEL_LAYOUT_PRESETS,
  CHANNEL_PAGE_ITEM_META,
  CHANNEL_PAGE_ITEM_TYPES,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
  type ChannelPageItemType,
} from '../lib/channelPageLayout';
import { ChannelPlaylistPicker } from './ChannelPlaylistPicker';

export const CHANNEL_BACKGROUND_LAYER_ID = 'header';

type Props = {
  items: ChannelPageItem[];
  selectedId: string | null;
  /** Which look section the current selection maps to, if any — drives the
   * side panel to fade in that element's own settings instead of the
   * generic layers list. `null` for blocks with no dedicated designer. */
  lookOpenSection?: string | null;
  activePresetId: ChannelLayoutPresetId | null;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onResize: (id: string, width: NonNullable<ChannelPageItem['width']>) => void;
  onRemove: (id: string) => void;
  onAdd: (type: ChannelPageItemType) => void;
  embedItems?: Array<{
    id: string;
    label: string;
    hint: string;
    embedInstanceId: string;
  }>;
  onAddEmbed?: (embedInstanceId: string) => void;
  onAddPlaylist?: (playlistSlug: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  onApplyPreset: (id: ChannelLayoutPresetId) => void;
  lookSlot?: React.ReactNode;
};

function FadeSwitch({
  activeKey,
  children,
}: {
  activeKey: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [activeKey]);
  return (
    <div
      key={activeKey}
      className={`flex h-full min-h-0 flex-col transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {children}
    </div>
  );
}

function layerLabel(item: ChannelPageItem): string {
  if (item.type === 'playlist' && item.playlistSlug) {
    return item.playlistSlug;
  }
  return CHANNEL_PAGE_ITEM_META[item.type].label;
}

export function ChannelLayersMenu({
  items,
  selectedId,
  lookOpenSection,
  activePresetId,
  onSelect,
  onToggleVisible,
  onResize,
  onRemove,
  onAdd,
  embedItems = [],
  onAddEmbed,
  onAddPlaylist,
  onReorder,
  onApplyPreset,
  lookSlot,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'presets' | 'layers' | 'add' | 'look'>(
    'presets',
  );

  useEffect(() => {
    if (lookOpenSection) {
      setPanel('look');
    } else if (selectedId) {
      setPanel('layers');
    }
  }, [selectedId, lookOpenSection]);

  const hiddenCatalog = CHANNEL_PAGE_ITEM_TYPES.filter((type) => {
    if (BACKDROP_FOLDED_ITEM_TYPES.includes(type)) {
      return false;
    }
    const row = items.find((i) => i.type === type);
    return !row || !row.visible;
  });

  const usedPlaylistSlugs = items
    .filter((item) => item.type === 'playlist' && item.playlistSlug)
    .map((item) => item.playlistSlug as string);

  const backgroundSelected = selectedId === CHANNEL_BACKGROUND_LAYER_ID;

  return (
    <aside
      data-testid="channel-layers-menu"
      className="border-border bg-background/75 flex h-full min-h-0 w-full flex-col overflow-hidden border-l backdrop-blur-md sm:w-96 lg:w-[24rem]"
    >
      <div className="border-border flex shrink-0 gap-1 border-b p-2">
        {(
          [
            { id: 'presets' as const, label: 'Presets' },
            { id: 'layers' as const, label: 'Layers' },
            { id: 'add' as const, label: 'Add' },
            { id: 'look' as const, label: 'Look' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPanel(t.id)}
            className={`flex-1 rounded-md px-1.5 py-1.5 text-[10px] font-medium tracking-wide uppercase ${
              panel === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={`min-h-0 flex-1 p-2 ${
          panel === 'look'
            ? 'flex flex-col overflow-hidden'
            : 'overflow-y-auto overscroll-contain'
        }`}
      >
        {panel === 'presets' && (
          <div className="flex flex-col gap-2">
            <p className="text-foreground-secondary text-xs">
              One-click layouts. Drag, hide, and add after applying.
            </p>
            {CHANNEL_LAYOUT_PRESETS.map((preset) => {
              const active = activePresetId === preset.id;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  variant="text"
                  size="flexible"
                  onClick={() => {
                    onApplyPreset(preset.id);
                    setPanel('layers');
                  }}
                  className={`border-border block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-primary/70 bg-primary/10'
                      : 'hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayoutTemplateIcon
                      size={14}
                      className="text-foreground-secondary shrink-0"
                    />
                    <div className="text-xs font-semibold tracking-wide">
                      {preset.name}
                    </div>
                  </div>
                  <p className="text-foreground-secondary mt-1 text-[11px] leading-snug">
                    {preset.description}
                  </p>
                  {active && (
                    <p className="text-primary mt-1.5 text-[10px] font-medium tracking-wide uppercase">
                      Applied
                    </p>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {panel === 'layers' && (
          <ul className="flex flex-col gap-1">
            <li
              className={`border-border flex items-center gap-1 rounded-md border px-1 py-1 ${
                backgroundSelected ? 'border-primary/60 bg-primary/10' : ''
              }`}
            >
              <span className="text-foreground-secondary w-5 shrink-0 px-0.5">
                <ImageIcon size={14} aria-hidden />
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => onSelect(CHANNEL_BACKGROUND_LAYER_ID)}
              >
                <div className="truncate text-xs font-medium">Background</div>
                <div className="text-foreground-secondary truncate text-[10px]">
                  Banner, page color, header style
                </div>
              </button>
            </li>
            {items.map((item) => {
              const meta = CHANNEL_PAGE_ITEM_META[item.type];
              const selected = selectedId === item.id;
              return (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragEnd={() => setDragId(null)}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) {
                      onReorder(dragId, item.id);
                    }
                    setDragId(null);
                  }}
                  className={`border-border flex items-center gap-1 rounded-md border px-1 py-1 ${
                    selected ? 'border-primary/60 bg-primary/10' : ''
                  } ${dragId === item.id ? 'opacity-50' : ''} ${
                    item.visible ? '' : 'opacity-60'
                  }`}
                >
                  <Tooltip content="Drag to reorder" side="top">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      className="text-foreground-secondary hover:text-foreground w-auto cursor-grab px-0.5 active:cursor-grabbing"
                      aria-label={`Drag ${meta.label}`}
                    >
                      <GripVerticalIcon size={14} />
                    </Button>
                  </Tooltip>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelect(item.id)}
                  >
                    <div className="truncate text-xs font-medium">
                      {meta.label}
                    </div>
                    <div className="text-foreground-secondary truncate text-[10px]">
                      {item.type === 'playlist' ? layerLabel(item) : meta.hint}
                    </div>
                  </button>
                  <div className="border-border flex shrink-0 items-center gap-0.5 rounded border p-0.5">
                    {(['compact', 'wide', 'full'] as const).map((width) => (
                      <button
                        key={width}
                        type="button"
                        className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase ${
                          (item.width ?? 'full') === width
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground-secondary hover:text-foreground'
                        }`}
                        aria-label={`${width} width for ${meta.label}`}
                        aria-pressed={(item.width ?? 'full') === width}
                        onClick={() => onResize(item.id, width)}
                      >
                        {width === 'compact'
                          ? 'S'
                          : width === 'wide'
                            ? 'M'
                            : 'L'}
                      </button>
                    ))}
                  </div>
                  <Tooltip
                    content={item.visible ? 'Hide layer' : 'Show layer'}
                    side="top"
                  >
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      aria-label={item.visible ? 'Hide' : 'Show'}
                      onClick={() => onToggleVisible(item.id)}
                    >
                      {item.visible ? (
                        <EyeIcon size={14} />
                      ) : (
                        <EyeOffIcon size={14} />
                      )}
                    </Button>
                  </Tooltip>
                  <Tooltip content="Remove from page" side="top">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="text"
                      aria-label="Remove from page"
                      onClick={() => onRemove(item.id)}
                    >
                      <Trash2Icon size={14} />
                    </Button>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )}

        {panel === 'add' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-foreground-secondary text-xs font-semibold tracking-wide uppercase">
                Playlist
              </p>
              <p className="text-foreground-secondary text-xs">
                Add a playlist from your library. You can add more than one.
              </p>
              {onAddPlaylist ? (
                <ChannelPlaylistPicker
                  usedSlugs={usedPlaylistSlugs}
                  onPick={(playlistSlug) => {
                    onAddPlaylist(playlistSlug);
                    setPanel('layers');
                  }}
                />
              ) : null}
            </div>
            <div className="border-border border-t pt-3">
              <p className="text-foreground-secondary mb-2 text-xs">
                Add a hidden block back onto the channel page.
              </p>
              {hiddenCatalog.length === 0 && embedItems.length === 0 ? (
                <p className="text-foreground-secondary text-xs">
                  Every block type is already on the page.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {hiddenCatalog.map((type) => {
                    const meta = CHANNEL_PAGE_ITEM_META[type];
                    return (
                      <li key={type}>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full justify-start"
                          onClick={() => {
                            onAdd(type);
                            setPanel('layers');
                          }}
                        >
                          <span className="inline-flex items-center gap-2">
                            <PlusIcon size={14} />
                            {meta.label}
                          </span>
                        </Button>
                      </li>
                    );
                  })}
                  {embedItems.map((embed) => (
                    <li key={embed.id}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full justify-start"
                        onClick={() => {
                          onAddEmbed?.(embed.embedInstanceId);
                          setPanel('layers');
                        }}
                      >
                        <span className="flex min-w-0 items-center gap-2 text-left">
                          <PlusIcon size={14} />
                          <span className="min-w-0">
                            <span className="block truncate">
                              {embed.label}
                            </span>
                            <span className="text-foreground-secondary block truncate text-[10px]">
                              {embed.hint}
                            </span>
                          </span>
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {panel === 'look' && (
          <div className="flex min-h-0 flex-1 flex-col">
            <FadeSwitch activeKey={lookOpenSection ?? 'default'}>
              <div className="flex h-full min-h-0 flex-col">
                {lookSlot ?? (
                  <p className="text-foreground-secondary text-xs">
                    Look controls unavailable.
                  </p>
                )}
              </div>
            </FadeSwitch>
          </div>
        )}
      </div>
    </aside>
  );
}
