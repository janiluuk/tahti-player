import type { TFunction } from '@tahti-player/i18n';

import type { ChannelGalleryMode } from '../../api/channel-gallery';

export const HEADER_MEDIA_TYPES = [
  'video/mp4',
  'video/webm',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export function galleryModes(
  t: TFunction<'web'>,
): Array<{ id: ChannelGalleryMode; label: string }> {
  return [
    { id: 'NONE', label: t('slideshowOptions.none') },
    { id: 'STATIC_SLIDESHOW', label: t('slideshowOptions.staticSlideshow') },
    { id: 'TWISTED_WAVE_GLSL', label: t('slideshowOptions.twistedWaveWebgl') },
    {
      id: 'ZOOM_BLUR_GLSL',
      label: t('slideshowOptions.cinematicZoomBlurWebgl'),
    },
    { id: 'RGB_SHIFT_GLSL', label: t('slideshowOptions.rgbShiftStripWebgl') },
    {
      id: 'POSTER_WALL_GLSL',
      label: t('slideshowOptions.posterScrollWallWebgl'),
    },
    {
      id: 'SHATTER_CAROUSEL_GLSL',
      label: t('slideshowOptions.shatterCarouselWebgl'),
    },
  ];
}

export const SLIDESHOW_PRESETS = [
  ['FADE', 'Fade'],
  ['ZOOM', 'Zoom'],
  ['PAN', 'Pan'],
  ['BLUR_CROSS', 'Blur crossfade'],
  ['PARTICLE_DISSOLVE', 'Particle dissolve'],
  ['GLITCH_WIPE', 'Glitch wipe'],
  ['CUBE_FLIP', 'Cube flip'],
  ['LIQUID_DISTORTION', 'Liquid distortion'],
] as const;

/** Gallery images are kept as newline-separated text; this is the list. */
export const splitGalleryImages = (text: string) =>
  text
    .split(/\r?\n/)
    .map((image) => image.trim())
    .filter(Boolean);
