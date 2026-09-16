import type { ReactNode } from 'react';

import { Button } from '@tahti-player/ui';

import type { PublicChannel } from '../../api/types';
import type {
  ChannelNavigationTab,
  ChannelPageItem,
} from '../../lib/channelPageLayout';
import { addItemType } from '../../lib/channelPageLayout';
import type { NormalizedColorScheme } from '../../lib/colorScheme';
import { ChannelBackdropCard } from '../ChannelBackdropCard';

/** Render-inputs for the `hero` block -- the player stage + header, the one
 * `ChannelPageItem` type too tightly coupled (~50+ closure variables in the
 * original file, `stagePlayer` chief among them) to live in
 * `ChannelViewBlocks.tsx` alongside the other 11 small block types. Pure
 * JSX+props extraction: `stagePlayer` is passed in ready-made (not rebuilt
 * here) since `ChannelView.tsx` renders that exact same node a second time,
 * as the fixed fallback next to `EntitySocialHeader` when this block is
 * hidden -- see that file's `data-testid="channel-stage-player-fixed"`. */
export type ChannelHeroBlockProps = {
  itemId: string;
  channel: PublicChannel;
  slug: string;
  editing: boolean;
  subtle: boolean;
  selectedId: string | null;
  onSelectHeader: () => void;
  channelVideoMuted: boolean;
  headerAccent: string;
  headerHighlight: string;
  headerBackground: string;
  headerForeground: string;
  brandGradient?: string;
  playerScheme: NormalizedColorScheme;
  usePlayerGradient?: boolean;
  playerColorSchemeJson?: string | null;
  heroVisualizerSettings?: { speed: number; intensity: number; scale: number };
  showNavTabs: boolean;
  navTabs: ChannelNavigationTab[];
  activeNavTab: ChannelNavigationTab | null;
  onSelectNavTab: (id: string) => void;
  layout: ChannelPageItem[];
  updateLayout: (
    updater:
      | ChannelPageItem[]
      | ((prev: ChannelPageItem[]) => ChannelPageItem[]),
    opts?: { clearPreset?: boolean },
  ) => void;
  /** Bio/CTA/avatar folded into the backdrop -- see BACKDROP_FOLDED_ITEM_TYPES
   * in channelPageLayout.ts. Derived from `layout`'s 'about'/'subscribe'/
   * 'avatar' items by ChannelView, not read from `layout` here directly. */
  avatarVisible: boolean;
  bioVisible: boolean;
  subscribeVisible: boolean;
  /** The player-stage content (now-playing overlay, play/favorite/chat
   * controls) -- built once in `ChannelView.tsx` and reused verbatim here
   * and in that file's hidden-hero fallback. */
  stagePlayer: ReactNode;
  /** `live`/`channelIsPlaying`/etc. only drive the play button in
   * `stagePlayer`, already baked in there -- nothing else in this block
   * needs them. */
};

export function ChannelHeroBlock({
  itemId,
  channel,
  slug,
  editing,
  subtle,
  selectedId,
  onSelectHeader,
  channelVideoMuted,
  headerAccent,
  headerHighlight,
  headerBackground,
  headerForeground,
  brandGradient,
  playerScheme,
  usePlayerGradient,
  playerColorSchemeJson,
  heroVisualizerSettings,
  showNavTabs,
  navTabs,
  activeNavTab,
  onSelectNavTab,
  layout,
  updateLayout,
  avatarVisible,
  bioVisible,
  subscribeVisible,
  stagePlayer,
}: ChannelHeroBlockProps) {
  // Opt-in: no bar at all until the artist adds a Navigation block with 2+
  // tabs (see showNavTabs/navTabs above) -- what shows here while editing is
  // exactly what listeners see, not a preview-only placeholder.
  const stageNavItems = showNavTabs
    ? navTabs.map((tab) => ({
        id: tab.id,
        label: tab.label || 'Untitled',
        active: tab.id === activeNavTab?.id,
        onClick:
          tab.id === activeNavTab?.id
            ? undefined
            : () => onSelectNavTab(tab.id),
      }))
    : [];
  const stageQuickAdd = editing
    ? [
        !layout.find((i) => i.type === 'links')?.visible
          ? {
              id: 'links',
              label: 'Links',
              onClick: () => updateLayout((prev) => addItemType(prev, 'links')),
            }
          : null,
        !layout.find((i) => i.type === 'about')?.visible
          ? {
              id: 'about',
              label: 'Bio',
              onClick: () => updateLayout((prev) => addItemType(prev, 'about')),
            }
          : null,
        !layout.find((i) => i.type === 'stats')?.visible
          ? {
              id: 'stats',
              label: 'Stats',
              onClick: () => updateLayout((prev) => addItemType(prev, 'stats')),
            }
          : null,
      ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip))
    : undefined;

  return (
    <div className="flex flex-col gap-0">
      <ChannelBackdropCard
        className={
          editing
            ? ''
            : subtle
              ? 'border-border/60 bg-background-input rounded-t-lg border border-b-0'
              : 'border-border rounded-t-xl border border-b-0'
        }
        minHeightClassName="min-h-[12rem] sm:min-h-[14rem]"
        displayName={channel.user.displayName}
        username={channel.user.username}
        channelSlug={slug}
        avatarUrl={channel.user.avatarUrl}
        bio={channel.user.bio}
        avatarVisible={avatarVisible}
        bioVisible={bioVisible}
        subscribeVisible={subscribeVisible}
        headerStyle={channel.headerStyle ?? 'GRADIENT'}
        videoBackgroundUrl={channel.videoBackgroundUrl}
        muted={channelVideoMuted}
        accent={headerAccent}
        highlight={headerHighlight}
        bg={headerBackground}
        fg={headerForeground}
        gradientOverride={brandGradient}
        visualPreset={channel.visualPreset ?? 'AURORA'}
        colorScheme={playerScheme}
        colorSchemeJson={
          usePlayerGradient
            ? (playerColorSchemeJson ?? null)
            : channel.colorSchemeJson
        }
        artworkUrl={channel.nowPlaying?.artworkUrl ?? channel.user.avatarUrl}
        galleryMode={channel.galleryMode}
        slideshowImages={channel.slideshowImages}
        slideshowPreset={channel.slideshowPreset}
        slideshowIntervalSeconds={channel.slideshowIntervalSeconds}
        slideshowTransitionMs={channel.slideshowTransitionMs}
        slideshowAutoplay={channel.slideshowAutoplay}
        visualizerSettings={heroVisualizerSettings}
        visualSettingsJson={channel.visualSettingsJson}
        navItems={[]}
        onEditIdentity={editing ? onSelectHeader : undefined}
        identitySelected={selectedId === 'header'}
        backgroundSelected={selectedId === itemId}
        editable={editing}
      />
      <div
        className={
          editing
            ? 'overflow-hidden'
            : subtle
              ? 'border-border/60 overflow-hidden border border-y-0'
              : 'border-border overflow-hidden border border-y-0'
        }
        data-testid="channel-stage-player"
      >
        {stagePlayer}
      </div>
      {stageNavItems.length > 0 || (stageQuickAdd?.length ?? 0) > 0 ? (
        <nav
          aria-label="Channel navigation"
          className={
            editing
              ? 'relative flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-xs font-semibold uppercase'
              : subtle
                ? 'border-border/60 relative flex flex-wrap items-center gap-x-5 gap-y-2 rounded-b-lg border border-t-0 px-4 py-3 text-xs font-semibold uppercase'
                : 'border-border relative flex flex-wrap items-center gap-x-5 gap-y-2 rounded-b-xl border border-t-0 px-4 py-3 text-xs font-semibold uppercase'
          }
          data-testid="channel-stage-nav"
        >
          {stageNavItems.map((navItem) =>
            navItem.onClick ? (
              <button
                key={navItem.id}
                type="button"
                onClick={navItem.onClick}
                className={
                  navItem.active
                    ? 'border-primary border-b-2 pb-2'
                    : 'text-foreground-secondary hover:text-foreground pb-2'
                }
              >
                {navItem.label}
              </button>
            ) : (
              <span
                key={navItem.id}
                className={
                  navItem.active
                    ? 'border-primary border-b-2 pb-2'
                    : 'text-foreground-secondary pb-2'
                }
              >
                {navItem.label}
              </span>
            ),
          )}
          {stageQuickAdd?.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              variant="text"
              size="flexible"
              onClick={chip.onClick}
              className="border-border text-foreground-secondary hover:bg-background-secondary ml-auto rounded-full border px-2.5 py-1 text-[10px] normal-case"
            >
              + {chip.label}
            </Button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
