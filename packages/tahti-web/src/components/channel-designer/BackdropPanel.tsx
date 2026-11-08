import { Trash2Icon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '@tahti-player/i18n';
import { Button, Tooltip } from '@tahti-player/ui';

import type { ColorScheme } from '../../api/channel-design';
import { BRAND_ACCENTS } from '../../api/channel-design';
import { Eyebrow } from '../tahti/Eyebrow';
import { AccentPairFields } from './AccentPairFields';
import { BackdropBackgroundExtras } from './BackdropBackgroundExtras';
import { BrandAccentSwatches } from './BrandAccentSwatches';
import { ColorSchemeFields } from './ColorSchemeFields';
import { HeaderStyleTabs, type HeaderDesignMode } from './HeaderStyleTabs';
import { PageBackgroundField } from './PageBackgroundField';

type Props = {
  scheme: ColorScheme;
  backgroundScheme: ColorScheme;
  useBackgroundGradient: boolean;
  brandAccentPreset: string | null | undefined;
  headerMode: HeaderDesignMode;
  hasBackdrop: boolean;
  backgroundVisualPreset: string | null | undefined;
  onPageBackgroundChange: (bg: string) => void;
  onHeaderModeChange: (mode: HeaderDesignMode) => void;
  onRemoveBackdrop?: () => void;
  onSchemeChange: (next: ColorScheme) => void;
  onBrandAccent: (brand: (typeof BRAND_ACCENTS)[number]) => void;
  onUseBackgroundGradient: (enabled: boolean) => void;
  onBackgroundSchemeChange: (next: ColorScheme) => void;
  onBackgroundVisualPreset: (preset: string) => void;
  /** Video / image upload + preview (owned by ChannelDesigner state). */
  videoSlot?: ReactNode;
  /** Slideshow gallery controls (owned by ChannelDesigner state). */
  slideshowSlot?: ReactNode;
};

/**
 * Look → Background panel: page fill plus one exclusive header-style body
 * (Gradient/Solid/Video/Slideshow/Visualization). Visualization replaces the
 * header treatment with the ambient visualizer + its own palette, same as
 * any other header style.
 */
export function BackdropPanel({
  scheme,
  backgroundScheme,
  useBackgroundGradient,
  brandAccentPreset,
  headerMode,
  hasBackdrop,
  backgroundVisualPreset,
  onPageBackgroundChange,
  onHeaderModeChange,
  onRemoveBackdrop,
  onSchemeChange,
  onBrandAccent,
  onUseBackgroundGradient,
  onBackgroundSchemeChange,
  onBackgroundVisualPreset,
  videoSlot,
  slideshowSlot,
}: Props) {
  const { t } = useTranslation('web');
  const brandRow = (
    <BrandAccentSwatches
      selectedId={brandAccentPreset}
      onSelect={onBrandAccent}
    />
  );
  const accents = (
    <AccentPairFields scheme={scheme} onChange={onSchemeChange} />
  );
  const visualizationTab = headerMode === 'VISUALIZATION';

  return (
    <div
      id="channel-designer-section-header"
      className="flex flex-col gap-6"
      data-testid="channel-backdrop-panel"
    >
      <section className="flex flex-col gap-3">
        {!visualizationTab && headerMode !== 'GRADIENT' ? (
          <PageBackgroundField
            scheme={scheme}
            backgroundScheme={backgroundScheme}
            useBackgroundGradient={useBackgroundGradient}
            onChange={onPageBackgroundChange}
          />
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{t('backdropPanel.headerStyle')}</Eyebrow>
          {hasBackdrop && onRemoveBackdrop ? (
            <Tooltip content={t('backdropPanel.removeBackdrop')} side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label={t('backdropPanel.removeBackdrop')}
                onClick={onRemoveBackdrop}
              >
                <Trash2Icon className="text-accent-red" size={15} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </div>
        <HeaderStyleTabs value={headerMode} onChange={onHeaderModeChange} />

        {visualizationTab ? (
          <BackdropBackgroundExtras
            useBackgroundGradient={useBackgroundGradient}
            onUseBackgroundGradient={onUseBackgroundGradient}
            backgroundScheme={backgroundScheme}
            onBackgroundSchemeChange={onBackgroundSchemeChange}
            backgroundVisualPreset={backgroundVisualPreset}
            onBackgroundVisualPreset={onBackgroundVisualPreset}
          />
        ) : null}

        {headerMode === 'GRADIENT' ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('backdropPanel.gradientColors')}</Eyebrow>
            <p className="text-foreground-secondary text-xs">
              {t('backdropPanel.presetsAndColorsForThe')}
            </p>
            <section className="flex flex-col gap-3">
              {brandRow}
              <ColorSchemeFields
                scheme={scheme}
                onChange={onSchemeChange}
                variant="generic"
              />
            </section>
          </div>
        ) : null}

        {headerMode === 'SOLID' ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('backdropPanel.solidColors')}</Eyebrow>
            <p className="text-foreground-secondary text-xs">
              {t('backdropPanel.solidHeaderUsesThePage')}
            </p>
            {brandRow}
            {accents}
          </div>
        ) : null}

        {headerMode === 'VIDEO_LOOP' ? (
          <div className="flex flex-col gap-3">
            {videoSlot}
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('backdropPanel.accents')}</Eyebrow>
              {brandRow}
              {accents}
            </div>
          </div>
        ) : null}

        {headerMode === 'SLIDESHOW' ? (
          <div className="flex flex-col gap-3">
            <Eyebrow>{t('backdropPanel.slideshow')}</Eyebrow>
            {slideshowSlot}
            <div className="flex flex-col gap-2">
              <Eyebrow>{t('backdropPanel.accents')}</Eyebrow>
              {brandRow}
              {accents}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
