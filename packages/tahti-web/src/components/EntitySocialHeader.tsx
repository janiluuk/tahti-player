import {
  MapPinIcon,
  UploadCloudIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

import { StatChip } from '@tahti-player/ui';

import {
  isHeaderImageUrl,
  isValidHeaderBackdropUrl,
  youtubeEmbedUrl,
} from '../api/channel-design';
import { cn } from '../lib/cn';
import {
  colorSchemeCssVars,
  normalizeColorScheme,
  type LooseColorScheme,
} from '../lib/colorScheme';
import { ChannelVisualizer } from './ChannelVisualizer';

const VIDEO_BACKDROP_PATTERN = /\.(mp4|webm)(\?|$)/i;

function isImageBackdropUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  if (VIDEO_BACKDROP_PATTERN.test(url)) {
    return false;
  }
  return isHeaderImageUrl(url) || url.startsWith('http') || url.startsWith('/');
}

const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact' });

export function formatCompactStat(value: number): string {
  return compactFormatter.format(value);
}

export type EntitySocialStat = {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
};

export type EntitySocialHeaderProps = {
  title: string;
  /** Square cover / avatar shown beside the title. */
  imageUrl?: string | null;
  imageAlt?: string;
  /** When true, image is a circle (artist); otherwise rounded square (collection). */
  roundImage?: boolean;
  /** Optional location / place badge under the title. */
  location?: string | null;
  /** Subtitle row under title (e.g. @username or “by Artist”). */
  subtitle?: ReactNode;
  /** Description under subtitle. */
  description?: ReactNode;
  /** Top-right actions (favorite, edit, …). */
  actions?: ReactNode;
  stats?: EntitySocialStat[];
  /** Backdrop image / video poster under the primary scrim. */
  backdropUrl?: string | null;
  /**
   * Channel Designer header treatment — GRADIENT / SOLID / VIDEO_LOOP.
   * When unset, falls back to image blur or visualizer.
   */
  headerStyle?: string | null;
  /** VIDEO_LOOP clip or static image URL from Channel Designer. */
  videoBackgroundUrl?: string | null;
  /** Optional brand accent gradient CSS when headerStyle is GRADIENT. */
  gradientOverride?: string | null;
  /** Mount a visualizer when there is no image/video/gradient/solid backdrop. */
  visualizerPreset?: string;
  visualSettingsJson?: string | null;
  artworkUrlForVisualizer?: string | null;
  /**
   * Channel / artist color scheme from Channel Designer. When set, paints the
   * card with `bg` / `text` / accent instead of theme `bg-primary` (which is
   * purple on Aurora and made designer colors look stuck).
   */
  colorScheme?: LooseColorScheme;
  onImageClick?: () => void;
  /** When set alongside `imageUrl`, a hover-reveal X badge clears the image. */
  onImageDelete?: () => void;
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
};

/**
 * Entity header for artist / channel / collection pages. Uses the channel
 * color scheme when provided; otherwise falls back to theme `bg-primary`.
 * Channel Designer header styles (gradient / solid / video) paint the card
 * backdrop the same way the channel hero does.
 */
export function EntitySocialHeader({
  title,
  imageUrl,
  imageAlt = '',
  roundImage = false,
  location,
  subtitle,
  description,
  actions,
  stats = [],
  backdropUrl,
  headerStyle,
  videoBackgroundUrl,
  gradientOverride,
  visualizerPreset,
  visualSettingsJson,
  artworkUrlForVisualizer,
  colorScheme,
  onImageClick,
  onImageDelete,
  className,
  children,
  'data-testid': dataTestId = 'entity-social-header',
}: EntitySocialHeaderProps) {
  const scheme = colorScheme ? normalizeColorScheme(colorScheme) : null;
  const mediaUrl = videoBackgroundUrl ?? backdropUrl;
  const showVideo =
    headerStyle === 'VIDEO_LOOP' && isValidHeaderBackdropUrl(mediaUrl);
  const mediaIsImage =
    isHeaderImageUrl(mediaUrl) || isImageBackdropUrl(mediaUrl);
  const youtubeSrc = showVideo ? youtubeEmbedUrl(mediaUrl, true) : null;
  const showSolid = headerStyle === 'SOLID' && Boolean(scheme);
  const showGradient = headerStyle === 'GRADIENT';
  const imageBackdrop =
    !showVideo &&
    !showSolid &&
    !showGradient &&
    mediaUrl &&
    isImageBackdropUrl(mediaUrl)
      ? mediaUrl
      : null;
  const hasDesignedBackdrop = showVideo || showSolid || showGradient;
  const showVisualizer =
    !hasDesignedBackdrop && !imageBackdrop && Boolean(visualizerPreset);
  const activeStats = stats.filter((stat) => stat.value > 0);
  const schemeStyle: CSSProperties | undefined = scheme
    ? ({
        ...colorSchemeCssVars(scheme),
        backgroundColor: showGradient || showVideo ? undefined : scheme.bg,
        color: scheme.text,
        borderColor: `${scheme.muted}66`,
      } as CSSProperties)
    : undefined;
  const scrimStyle: CSSProperties | undefined = scheme
    ? { backgroundColor: `${scheme.bg}bf` }
    : undefined;
  const visualizerScheme = scheme
    ? {
        accent: scheme.accent,
        highlight: scheme.highlight,
        bg: scheme.bg,
        text: scheme.text,
        muted: scheme.muted,
      }
    : undefined;
  const gradientBackground =
    gradientOverride ??
    (scheme
      ? `linear-gradient(135deg, ${scheme.bg}, ${scheme.accent} 55%, ${scheme.highlight})`
      : undefined);

  return (
    <div
      className={cn(
        'border-border shadow-shadow relative isolate flex flex-col gap-5 overflow-hidden rounded-md border-(length:--border-width) p-6',
        !scheme && !hasDesignedBackdrop && 'bg-primary',
        className,
      )}
      style={schemeStyle}
      data-testid={dataTestId}
      data-header-style={headerStyle ?? undefined}
    >
      {showVideo && youtubeSrc ? (
        <iframe
          title=""
          src={youtubeSrc}
          className="pointer-events-none absolute inset-0 -z-20 size-full scale-110 object-cover opacity-50"
          allow="autoplay; encrypted-media"
          aria-hidden
        />
      ) : null}
      {showVideo && !youtubeSrc && mediaIsImage ? (
        <img
          src={mediaUrl ?? undefined}
          alt=""
          className="pointer-events-none absolute inset-0 -z-20 size-full scale-110 object-cover opacity-50"
          aria-hidden
        />
      ) : null}
      {showVideo && !youtubeSrc && !mediaIsImage ? (
        <video
          className="pointer-events-none absolute inset-0 -z-20 size-full scale-110 object-cover opacity-50"
          src={mediaUrl ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      ) : null}
      {showSolid && scheme ? (
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{ backgroundColor: scheme.bg }}
          aria-hidden
        />
      ) : null}
      {showGradient && gradientBackground ? (
        <div
          className="pointer-events-none absolute inset-0 -z-20"
          style={{ backgroundImage: gradientBackground }}
          aria-hidden
        />
      ) : null}
      {imageBackdrop ? (
        <img
          src={imageBackdrop}
          alt=""
          className="pointer-events-none absolute inset-0 -z-10 size-full scale-110 object-cover opacity-35 blur-3xl"
          aria-hidden
        />
      ) : null}
      {showVisualizer && visualizerPreset ? (
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-55">
          <ChannelVisualizer
            preset={visualizerPreset}
            artworkUrl={artworkUrlForVisualizer ?? imageUrl ?? undefined}
            colorScheme={visualizerScheme}
            visualSettingsJson={visualSettingsJson}
            className="size-full"
          />
        </div>
      ) : null}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -z-10 backdrop-blur-xl',
          !scheme && 'bg-primary/75',
        )}
        style={scrimStyle}
      />

      {actions ? (
        <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-5">
        {imageUrl ? (
          onImageClick ? (
            <div className="group relative size-24 shrink-0">
              <button
                type="button"
                onClick={onImageClick}
                className={cn(
                  'border-border shadow-shadow size-24 overflow-hidden border-(length:--border-width) p-0',
                  roundImage ? 'rounded-full' : 'rounded-md',
                )}
                aria-label={`Change ${title} artwork`}
              >
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  className="size-full object-cover"
                />
              </button>
              {onImageDelete ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onImageDelete();
                  }}
                  aria-label={`Remove ${title} artwork`}
                  title="Remove artwork"
                  className="border-border bg-background text-accent-red shadow-shadow hover:bg-background-secondary absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border-(length:--border-width) opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                >
                  <XIcon size={12} aria-hidden />
                </button>
              ) : null}
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={imageAlt}
              className={cn(
                'border-border shadow-shadow size-24 shrink-0 border-(length:--border-width) object-cover',
                roundImage ? 'rounded-full' : 'rounded-md',
              )}
            />
          )
        ) : onImageClick ? (
          <button
            type="button"
            onClick={onImageClick}
            className={cn(
              'border-border bg-background-secondary/40 text-foreground-secondary shadow-shadow flex size-24 shrink-0 items-center justify-center border-(length:--border-width)',
              roundImage ? 'rounded-full' : 'rounded-md',
            )}
            aria-label={`Upload ${title} artwork`}
          >
            <UploadCloudIcon size={22} aria-hidden />
          </button>
        ) : (
          <div
            className={cn(
              'border-border bg-background-secondary/40 shadow-shadow size-24 shrink-0 border-(length:--border-width)',
              roundImage ? 'rounded-full' : 'rounded-md',
            )}
            aria-hidden
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-12">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          {location ? (
            <span
              className={cn(
                'inline-flex w-fit items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-bold',
                !scheme && 'bg-accent-orange border-border',
              )}
              style={
                scheme
                  ? {
                      backgroundColor: `${scheme.accent}33`,
                      borderColor: `${scheme.accent}66`,
                      color: scheme.text,
                    }
                  : undefined
              }
            >
              <MapPinIcon size={14} aria-hidden />
              {location}
            </span>
          ) : null}
          {subtitle ? (
            <div
              className={cn('text-sm', !scheme && 'text-foreground-secondary')}
              style={scheme ? { color: scheme.muted } : undefined}
            >
              {subtitle}
            </div>
          ) : null}
          {description ? (
            <div
              className="mt-1 text-sm"
              style={scheme ? { color: scheme.text } : undefined}
            >
              {description}
            </div>
          ) : null}
        </div>
      </div>

      {activeStats.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {activeStats.map((stat) => (
            <StatChip
              key={stat.key}
              icon={<stat.icon size={14} aria-hidden />}
              label={stat.label}
              value={formatCompactStat(stat.value)}
            />
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}
