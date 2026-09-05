import type { ReactNode } from 'react';

import {
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  resolvePublicVisualizerPreset,
} from '../api/channel-design';
import { ChannelVisualizer, type VisualColorScheme } from './ChannelVisualizer';

export type ChannelBackdropNavItem = {
  id: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
};

export type ChannelBackdropQuickAdd = {
  id: string;
  label: string;
  onClick: () => void;
};

export type ChannelBackdropCardProps = {
  displayName: string;
  username: string;
  channelSlug?: string;
  avatarUrl?: string | null;
  bio?: string | null;

  headerStyle: string;
  videoBackgroundUrl?: string | null;
  muted?: boolean;
  accent: string;
  highlight: string;
  bg: string;
  fg: string;
  /** Overrides the computed bg/accent/highlight gradient for the GRADIENT
   * header style — used by ChannelDesigner's preview to reflect a chosen
   * brand accent preset, which the real page doesn't have a field for yet. */
  gradientOverride?: string;
  /** Bypass the normal URL-pattern based video/image detection — used by
   * the editor to preview a locally-selected file (a blob: URL) before it's
   * uploaded, which can't be pattern-matched like a saved https:// URL. */
  showVideoOverride?: boolean;
  isImageOverride?: boolean;
  visualPreset: string;
  colorScheme?: VisualColorScheme | null;
  colorSchemeJson?: string | null;
  artworkUrl?: string | null;
  galleryMode?: string | null;
  slideshowImages?: string[];
  /** Skip mounting a second live ChannelVisualizer WebGL context — set
   * false wherever this card renders underneath a page that may already
   * have one running. Default true. */
  mountVisualizer?: boolean;
  visualizerSettings?: { speed: number; intensity: number; scale: number };
  visualSettingsJson?: string | null;

  badge?: ReactNode;
  navItems?: ChannelBackdropNavItem[];
  quickAdd?: ChannelBackdropQuickAdd[];
  onEditIdentity?: () => void;
  onEditBackground?: () => void;
  identitySelected?: boolean;
  backgroundSelected?: boolean;
  editable?: boolean;
  minHeightClassName?: string;
  /** Bottom-anchored content over the scrim — WifiOff icon, now-playing
   * overlay + seekbar, play/favorite buttons. Caller-supplied since it's
   * wired to page-specific playback state. */
  bottomSlot?: ReactNode;
  className?: string;
};

const DEFAULT_NAV_ITEMS: ChannelBackdropNavItem[] = [
  { id: 'home', label: 'Stage', active: true },
  { id: 'tracks', label: 'Tracks' },
  { id: 'about', label: 'About' },
];

/** The channel page's identity + backdrop + stage, merged into one hero
 * card — shared by ChannelDesigner's preview and ChannelView's real page so
 * the two can no longer drift apart the way the old separate mockup did.
 * Background resolution mirrors the real page's original hero logic
 * exactly: VIDEO_LOOP → video/image/YouTube embed, SOLID → flat color,
 * GRADIENT → bg/accent/highlight gradient, STATIC_SLIDESHOW → first image,
 * else → dimmed artwork + live visualizer. */
export function ChannelBackdropCard({
  displayName,
  username,
  channelSlug,
  avatarUrl,
  bio,
  headerStyle,
  videoBackgroundUrl,
  muted = true,
  accent,
  highlight,
  bg,
  fg,
  gradientOverride,
  showVideoOverride,
  isImageOverride,
  visualPreset,
  colorScheme,
  colorSchemeJson,
  artworkUrl,
  galleryMode,
  slideshowImages,
  mountVisualizer = true,
  visualizerSettings,
  visualSettingsJson,
  badge,
  navItems = DEFAULT_NAV_ITEMS,
  quickAdd,
  onEditIdentity,
  onEditBackground,
  identitySelected,
  backgroundSelected,
  editable = false,
  minHeightClassName = 'min-h-[26rem] sm:min-h-[34rem]',
  bottomSlot,
  className,
}: ChannelBackdropCardProps) {
  const showVideo =
    showVideoOverride ??
    (headerStyle === 'VIDEO_LOOP' &&
      isValidHeaderBackdropUrl(videoBackgroundUrl));
  const backdropIsImage =
    isImageOverride ?? isHeaderImageUrl(videoBackgroundUrl);
  const showSolid = headerStyle === 'SOLID';
  const showGradient = headerStyle === 'GRADIENT';
  const showSlideshow =
    !showVideo &&
    !showSolid &&
    !showGradient &&
    galleryMode === 'STATIC_SLIDESHOW' &&
    Boolean(slideshowImages?.[0]);

  return (
    <div
      data-testid="channel-backdrop-card"
      data-header-style={headerStyle}
      className={`relative w-full overflow-hidden ${minHeightClassName} ${className ?? ''}`}
    >
      {showVideo ? (
        backdropIsImage ? (
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={videoBackgroundUrl ?? undefined}
            alt=""
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={videoBackgroundUrl ?? undefined}
            autoPlay
            loop
            muted={muted}
            playsInline
            aria-hidden="true"
          />
        )
      ) : showSolid ? (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: bg }}
          aria-hidden
        />
      ) : showGradient ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              gradientOverride ??
              `linear-gradient(135deg, ${bg}, ${accent} 55%, ${highlight})`,
          }}
          aria-hidden
        />
      ) : showSlideshow ? (
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={slideshowImages?.[0]}
          alt=""
        />
      ) : (
        <>
          {artworkUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${artworkUrl})` }}
              aria-hidden
            />
          ) : null}
          {mountVisualizer && (
            <ChannelVisualizer
              className="absolute inset-0 h-full w-full opacity-95 [filter:saturate(1.3)]"
              preset={resolvePublicVisualizerPreset(visualPreset)}
              colorScheme={colorScheme}
              colorSchemeJson={colorSchemeJson}
              visualSettingsJson={visualSettingsJson}
              settings={visualizerSettings}
              artworkUrl={artworkUrl}
            />
          )}
        </>
      )}

      <div className="absolute inset-0 bg-black/25" aria-hidden />

      <div
        role={onEditIdentity ? 'button' : undefined}
        tabIndex={onEditIdentity ? 0 : undefined}
        aria-label={onEditIdentity ? 'Edit backdrop design' : undefined}
        title={onEditIdentity ? 'Edit backdrop design' : undefined}
        onClick={
          onEditIdentity
            ? (event) => {
                event.stopPropagation();
                onEditIdentity();
              }
            : undefined
        }
        onKeyDown={
          onEditIdentity
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onEditIdentity();
                }
              }
            : undefined
        }
        className={`relative z-[1] p-4 pr-24 outline-none sm:p-6 sm:pr-40 ${
          onEditIdentity ? 'cursor-pointer' : ''
        } ${
          editable
            ? `rounded-lg transition-shadow hover:ring-2 hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-white/70 ${
                identitySelected ? 'ring-primary ring-2' : ''
              }`
            : ''
        }`}
        style={{ color: fg }}
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div
            className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-3xl font-bold sm:size-32 sm:text-4xl"
            style={{ borderColor: accent, background: bg }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div
              data-testid="channel-backdrop-card-name"
              className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl"
            >
              {displayName}
            </div>
            <div
              data-testid="channel-backdrop-card-handle"
              className="text-sm opacity-80"
            >
              @{username}
              {channelSlug ? ` · /${channelSlug}` : ''}
            </div>
            {bio ? (
              <p className="mt-1 line-clamp-2 text-sm opacity-90">{bio}</p>
            ) : null}
          </div>
          {badge}
        </div>
        {navItems.length > 0 ? (
          <nav
            aria-label="Channel navigation"
            className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-3 text-xs font-semibold uppercase opacity-90"
          >
            {navItems.map((navItem) =>
              navItem.onClick ? (
                <button
                  key={navItem.id}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navItem.onClick?.();
                  }}
                  className={navItem.active ? 'border-b-2 pb-2' : 'pb-2'}
                  style={navItem.active ? { borderColor: accent } : undefined}
                >
                  {navItem.label}
                </button>
              ) : (
                <span
                  key={navItem.id}
                  className={navItem.active ? 'border-b-2 pb-2' : 'pb-2'}
                  style={navItem.active ? { borderColor: accent } : undefined}
                >
                  {navItem.label}
                </span>
              ),
            )}
            {quickAdd?.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  chip.onClick();
                }}
                className="ml-auto rounded-full border border-white/30 px-2.5 py-1 text-[10px] normal-case opacity-90 hover:bg-white/10 hover:opacity-100"
              >
                + {chip.label}
              </button>
            ))}
          </nav>
        ) : null}
      </div>

      {bottomSlot != null ? (
        <div
          role={onEditBackground ? 'button' : undefined}
          tabIndex={onEditBackground ? 0 : undefined}
          aria-label={onEditBackground ? 'Edit player design' : undefined}
          title={onEditBackground ? 'Edit player design' : undefined}
          onClick={
            onEditBackground
              ? (event) => {
                  event.stopPropagation();
                  onEditBackground();
                }
              : undefined
          }
          onKeyDown={
            onEditBackground
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    onEditBackground();
                  }
                }
              : undefined
          }
          className={`absolute inset-x-0 bottom-0 z-[1] outline-none ${
            onEditBackground ? 'cursor-pointer' : ''
          } ${
            editable && backgroundSelected
              ? 'ring-primary ring-2 ring-inset'
              : ''
          }`}
        >
          {bottomSlot}
        </div>
      ) : null}
    </div>
  );
}
