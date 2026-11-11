import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import {
  Button,
  ButtonLink,
  ClampedText,
  ImageReveal,
  MediaArtwork,
} from '@tahti-player/ui';

import {
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  resolvePublicVisualizerPreset,
} from '../api/channel-design';
import { isSafeChannelLinkUrl } from '../lib/safeHref';
import { ChannelSlideshowBackdrop } from './ChannelSlideshowBackdrop';
import { ChannelVisualizer, type VisualColorScheme } from './ChannelVisualizer';
import { TahtiMemberBadge } from './TahtiMemberBadge';

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
  nameAsHeading?: boolean;
  username: string;
  /** Shows the Tahti ry member badge beside the name. */
  isMember?: boolean;
  channelSlug?: string;
  avatarUrl?: string | null;
  /** Still first frame of an animated `avatarUrl`. */
  avatarPosterUrl?: string | null;
  bio?: string | null;
  links?: Array<{ label: string; url: string; hidden?: boolean }> | null;
  linksVisible?: boolean;
  /** Backdrop toggles (Channel Designer → Backdrop settings) — bio/CTA
   * folded into the backdrop instead of being separate draggable page
   * blocks; avatar was always shown before this toggle existed, so it
   * defaults true. */
  avatarVisible?: boolean;
  bioVisible?: boolean;
  subscribeVisible?: boolean;
  /** While editing: avatar, bio and Subscribe that are off still render,
   * faded, so the artist sees where they go. */
  showOffFeatures?: boolean;
  subscribeLabel?: string;

  headerStyle: string;
  /** Optional short line in a strip across the top of the hero. */
  topBarText?: string | null;
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
  /** How the slideshow (2+ `slideshowImages`) cycles — one of
   * `ChannelDesigner`'s 8 `SLIDESHOW_PRESETS`. Ignored for a single image. */
  slideshowPreset?: string | null;
  slideshowIntervalSeconds?: number;
  slideshowTransitionMs?: number;
  slideshowAutoplay?: boolean;
  /** Skip mounting a second live ChannelVisualizer WebGL context — set
   * false wherever this card renders underneath a page that may already
   * have one running. Default true. */
  mountVisualizer?: boolean;
  visualizerSettings?: { speed: number; intensity: number; scale: number };
  visualSettingsJson?: string | null;

  badge?: ReactNode;
  identityActions?: ReactNode;
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
  /** A control in the card's top-left corner (the page's back button);
   * the identity row moves right to make room for it. */
  leading?: ReactNode;
  className?: string;
};

function shownBackdropLinks(
  links:
    Array<{ label: string; url: string; hidden?: boolean }> | null | undefined,
  showHidden: boolean,
) {
  return (links ?? []).filter(
    (link) =>
      link.label.trim() &&
      link.url.trim() &&
      isSafeChannelLinkUrl(link.url) &&
      (showHidden || !link.hidden),
  );
}

/** The channel page's identity + backdrop + stage, merged into one hero
 * card — shared by ChannelDesigner's preview and ChannelView's real page so
 * the two can no longer drift apart the way the old separate mockup did.
 * Background resolution mirrors the real page's original hero logic
 * exactly: VIDEO_LOOP → video/image/YouTube embed, SOLID → flat color,
 * GRADIENT → bg/accent/highlight gradient, STATIC_SLIDESHOW → rotating
 * images with the configured transition (`ChannelSlideshowBackdrop`),
 * else → dimmed artwork + live visualizer. */
export function ChannelBackdropCard({
  displayName,
  nameAsHeading = false,
  username,
  isMember,
  channelSlug,
  avatarUrl,
  avatarPosterUrl,
  bio,
  links,
  linksVisible = false,
  avatarVisible = true,
  bioVisible = true,
  subscribeVisible = false,
  showOffFeatures = false,
  subscribeLabel = 'Subscribe',
  headerStyle,
  topBarText,
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
  slideshowPreset,
  slideshowIntervalSeconds,
  slideshowTransitionMs,
  slideshowAutoplay,
  mountVisualizer = true,
  visualizerSettings,
  visualSettingsJson,
  badge,
  identityActions,
  navItems: navItemsProp,
  quickAdd,
  onEditIdentity,
  onEditBackground,
  identitySelected,
  backgroundSelected,
  editable = false,
  minHeightClassName = 'min-h-[26rem] sm:min-h-[34rem]',
  bottomSlot,
  leading,
  className,
}: ChannelBackdropCardProps) {
  const { t } = useTranslation('web');
  const backdropLinks = shownBackdropLinks(links, showOffFeatures);
  const defaultNavItems: ChannelBackdropNavItem[] = [
    {
      id: 'home',
      label: t('channelBackdropCardLeftovers.stage'),
      active: true,
    },
    { id: 'tracks', label: t('channelBackdropCardLeftovers.tracks') },
    { id: 'about', label: t('channelBackdropCardLeftovers.about') },
  ];
  const navItems = navItemsProp ?? defaultNavItems;
  const NameTag = nameAsHeading ? 'h1' : 'div';
  const showVideo =
    showVideoOverride ??
    (headerStyle === 'VIDEO_LOOP' &&
      isValidHeaderBackdropUrl(videoBackgroundUrl));
  const backdropIsImage =
    isImageOverride ?? isHeaderImageUrl(videoBackgroundUrl);
  const showSolid = headerStyle === 'SOLID';
  // The designer's "Slideshow" header mode saves headerStyle GRADIENT plus a
  // gallery mode, so a gallery with images wins over the plain gradient.
  const showSlideshow =
    !showVideo &&
    !showSolid &&
    galleryMode === 'STATIC_SLIDESHOW' &&
    Boolean(slideshowImages?.[0]);
  const showGradient = headerStyle === 'GRADIENT' && !showSlideshow;

  return (
    <div
      data-testid="channel-backdrop-card"
      data-header-style={headerStyle}
      className={`relative w-full overflow-hidden ${minHeightClassName} ${className ?? ''}`}
    >
      {showVideo ? (
        backdropIsImage ? (
          <ImageReveal
            className="absolute inset-0 h-full w-full"
            imgClassName="object-cover"
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
        <ChannelSlideshowBackdrop
          className="absolute inset-0 h-full w-full overflow-hidden"
          images={slideshowImages ?? []}
          preset={slideshowPreset}
          intervalSeconds={slideshowIntervalSeconds}
          transitionMs={slideshowTransitionMs}
          autoplay={slideshowAutoplay}
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
              channelKey={username}
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

      {topBarText?.trim() ? (
        <div
          data-testid="channel-backdrop-top-bar"
          className="relative z-[1] truncate bg-black/40 px-4 py-1.5 text-center text-xs font-semibold tracking-wide backdrop-blur-sm sm:text-sm"
          style={{ color: fg }}
        >
          {topBarText.trim()}
        </div>
      ) : null}

      {leading ? (
        <div className="absolute top-3 left-3 z-[2]">{leading}</div>
      ) : null}
      <div
        className={`relative z-[1] p-4 outline-none sm:p-6 sm:pr-40 ${
          editable ? 'pr-12' : ''
        } ${leading ? 'pl-[4.5rem] sm:pl-[4.5rem]' : ''} ${
          editable
            ? `rounded-lg transition-shadow hover:ring-2 hover:ring-white/40 ${
                identitySelected ? 'ring-primary ring-2' : ''
              }`
            : ''
        }`}
        style={{ color: fg }}
      >
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {avatarVisible || showOffFeatures ? (
            <div
              data-off={!avatarVisible || undefined}
              className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 text-3xl font-bold data-off:opacity-40 sm:size-32 sm:text-4xl"
              style={{ borderColor: accent, background: bg }}
            >
              {avatarUrl ? (
                <MediaArtwork
                  src={avatarUrl}
                  posterSrc={avatarPosterUrl}
                  imageReveal={false}
                />
              ) : (
                displayName.slice(0, 1).toUpperCase()
              )}
            </div>
          ) : null}
          <div className="min-w-36 flex-1">
            <div
              role={onEditIdentity ? 'button' : undefined}
              tabIndex={onEditIdentity ? 0 : undefined}
              aria-label={
                onEditIdentity
                  ? t('channelBackdropCardLeftovers.editBackdropDesign')
                  : undefined
              }
              title={
                onEditIdentity
                  ? t('channelBackdropCardLeftovers.editBackdropDesign')
                  : undefined
              }
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
              className={`outline-none ${
                onEditIdentity
                  ? 'cursor-pointer rounded-sm focus-visible:ring-2 focus-visible:ring-white/70'
                  : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <NameTag
                  data-testid="channel-backdrop-card-name"
                  className="font-display text-2xl font-extrabold tracking-tight break-words sm:text-3xl"
                >
                  {displayName}
                </NameTag>
                <TahtiMemberBadge isMember={isMember} />
              </div>
              <div
                data-testid="channel-backdrop-card-handle"
                className="text-sm opacity-80"
              >
                @{username}
                {channelSlug ? ` · /${channelSlug}` : ''}
              </div>
            </div>
            {(bioVisible || showOffFeatures) && bio ? (
              <ClampedText
                wrapperClassName={bioVisible ? 'mt-1' : 'mt-1 opacity-40'}
                className="text-sm whitespace-pre-wrap opacity-90"
              >
                {bio}
              </ClampedText>
            ) : null}
            {(linksVisible || showOffFeatures) && backdropLinks.length > 0 ? (
              <div
                data-testid="channel-backdrop-links"
                className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm ${
                  linksVisible ? '' : 'opacity-40'
                }`}
              >
                {backdropLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.url}`}
                    href={link.url}
                    target={
                      link.url.startsWith('mailto:') ? undefined : '_blank'
                    }
                    rel="noopener noreferrer"
                    className={
                      link.hidden ? 'underline opacity-50' : 'underline'
                    }
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          {identityActions ? (
            <div
              className="flex min-w-0 flex-wrap items-center gap-2"
              data-testid="channel-backdrop-identity-actions"
              onClick={(event) => event.stopPropagation()}
            >
              {identityActions}
            </div>
          ) : null}
          {subscribeVisible || showOffFeatures ? (
            <ButtonLink
              to="/subscribe/$username"
              params={{ username }}
              onClick={(event) => event.stopPropagation()}
              size="sm"
              variant="secondary"
              data-testid="channel-backdrop-subscribe-cta"
              data-off={!subscribeVisible || undefined}
              className="shrink-0 data-off:opacity-40"
            >
              {subscribeLabel}
            </ButtonLink>
          ) : null}
          {badge}
        </div>
        {navItems.length > 0 ? (
          <nav
            aria-label={t('channelBackdropCardText.channelNavigation')}
            className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/20 pt-3 text-xs font-semibold uppercase opacity-90"
          >
            {navItems.map((navItem) =>
              navItem.onClick ? (
                <Button
                  key={navItem.id}
                  type="button"
                  variant="text"
                  size="flexible"
                  onClick={(event) => {
                    event.stopPropagation();
                    navItem.onClick?.();
                  }}
                  className={`rounded-none text-xs font-semibold uppercase hover:bg-transparent ${navItem.active ? 'border-b-2 pb-2' : 'pb-2'}`}
                  style={
                    navItem.active
                      ? { borderColor: accent, color: 'inherit' }
                      : { color: 'inherit' }
                  }
                >
                  {navItem.label}
                </Button>
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
              <Button
                key={chip.id}
                type="button"
                variant="text"
                size="flexible"
                onClick={(event) => {
                  event.stopPropagation();
                  chip.onClick();
                }}
                className="ml-auto rounded-full border border-white/30 px-2.5 py-1 text-[10px] normal-case opacity-90 hover:bg-white/10 hover:opacity-100"
              >
                + {chip.label}
              </Button>
            ))}
          </nav>
        ) : null}
      </div>

      {bottomSlot != null ? (
        <div
          role={onEditBackground ? 'button' : undefined}
          tabIndex={onEditBackground ? 0 : undefined}
          aria-label={
            onEditBackground
              ? t('channelBackdropCardLeftovers.editPlayerDesign')
              : undefined
          }
          title={
            onEditBackground
              ? t('channelBackdropCardLeftovers.editPlayerDesign')
              : undefined
          }
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
          className={`focus-visible:ring-primary absolute inset-x-0 bottom-0 z-[1] outline-none focus-visible:ring-2 focus-visible:ring-inset ${
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
