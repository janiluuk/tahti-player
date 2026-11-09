import type { CSSProperties } from 'react';

import { useTranslation } from '@tahti-player/i18n';

import {
  isActiveTextOverlay,
  type TextOverlayMode,
} from '../api/channel-design';

import './channelTextOverlay.css';

const MODE_CLASS: Partial<Record<TextOverlayMode, string>> = {
  GRADIENT_SHIMMER: 'channel-text-overlay--gradient-shimmer',
  COSMIC_NEON: 'channel-text-overlay--cosmic-neon',
  SHIMMER_LINES: 'channel-text-overlay--shimmer-lines',
  GHOST_ECHO: 'channel-text-overlay--ghost-echo',
};

function alignClass(align: string | null | undefined): string {
  if (align === 'LEFT') {
    return 'channel-text-overlay--left';
  }
  if (align === 'RIGHT') {
    return 'channel-text-overlay--right';
  }
  return 'channel-text-overlay--center';
}

/** Renders a stylized headline for either the channel page's Text overlay
 * block or the player stage's Overlay tab — same live-updating view is used
 * by the designer's canvas/preview and by the real published page, so
 * there's exactly one place this effect can drift. */
export function ChannelTextOverlayView({
  mode,
  text,
  align,
  accent,
  highlight,
  size = 'lg',
  className,
}: {
  mode: string | null | undefined;
  text: string | null | undefined;
  align: string | null | undefined;
  accent?: string;
  highlight?: string;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const { t } = useTranslation('web');
  if (!isActiveTextOverlay({ mode, text })) {
    return null;
  }
  const effectClass = MODE_CLASS[mode as TextOverlayMode];
  if (!effectClass) {
    return null;
  }
  return (
    <h2
      data-overlay-text={text ?? ''}
      aria-label={t('channelTextOverlayViewText.channelTextOverlay')}
      className={`channel-text-overlay ${effectClass} ${alignClass(align)} ${
        size === 'sm' ? 'text-lg' : 'text-2xl sm:text-4xl'
      } ${className ?? ''}`}
      style={
        {
          '--overlay-accent': accent ?? '#22D3EE',
          '--overlay-highlight': highlight ?? '#A78BFA',
        } as CSSProperties
      }
    >
      {text}
    </h2>
  );
}
