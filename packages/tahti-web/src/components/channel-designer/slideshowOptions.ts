import type { ParseKeys, TFunction } from '@tahti-player/i18n';

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
  ['FADE', 'slideshowOptionsBatch34.fade'],
  ['ZOOM', 'slideshowOptionsBatch34.zoom'],
  ['PAN', 'slideshowOptionsBatch34.pan'],
  ['BLUR_CROSS', 'slideshowOptionsBatch34.blurCrossfade'],
  ['PARTICLE_DISSOLVE', 'slideshowOptionsBatch34.particleDissolve'],
  ['GLITCH_WIPE', 'slideshowOptionsBatch34.glitchWipe'],
  ['CUBE_FLIP', 'slideshowOptionsBatch34.cubeFlip'],
  ['LIQUID_DISTORTION', 'slideshowOptionsBatch34.liquidDistortion'],
] as const satisfies ReadonlyArray<readonly [string, ParseKeys<'web'>]>;

/** Gallery images are kept as newline-separated text; this is the list. */
export const splitGalleryImages = (text: string) =>
  text
    .split(/\r?\n/)
    .map((image) => image.trim())
    .filter(Boolean);
