import { Trash2Icon } from 'lucide-react';
import type { ReactNode } from 'react';

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
 * Look → Background panel: page fill, exclusive header-style bodies, then
 * optional separate palette + ambient visualizer.
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
  const brandRow = (
    <BrandAccentSwatches
      selectedId={brandAccentPreset}
      onSelect={onBrandAccent}
    />
  );
  const accents = (
    <AccentPairFields scheme={scheme} onChange={onSchemeChange} />
  );

  return (
    <div
      id="channel-designer-section-header"
      className="flex flex-col gap-6"
      data-testid="channel-backdrop-panel"
    >
      <section className="flex flex-col gap-3">
        {headerMode !== 'GRADIENT' ? (
          <PageBackgroundField
            scheme={scheme}
            backgroundScheme={backgroundScheme}
            useBackgroundGradient={useBackgroundGradient}
            onChange={onPageBackgroundChange}
          />
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>Header style</Eyebrow>
          {hasBackdrop && onRemoveBackdrop ? (
            <Tooltip content="Remove backdrop" side="top">
              <Button
                size="icon-sm"
                variant="text"
                aria-label="Remove backdrop"
                onClick={onRemoveBackdrop}
              >
                <Trash2Icon size={15} aria-hidden />
              </Button>
            </Tooltip>
          ) : null}
        </div>
        <HeaderStyleTabs value={headerMode} onChange={onHeaderModeChange} />

        {headerMode === 'GRADIENT' ? (
          <div className="flex flex-col gap-2">
            <Eyebrow>Gradient colors</Eyebrow>
            <p className="text-foreground-secondary text-xs">
              Presets and colors for the gradient header.
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
            <Eyebrow>Solid colors</Eyebrow>
            <p className="text-foreground-secondary text-xs">
              Solid header uses the page background above. Tune accents here.
            </p>
            {brandRow}
            {accents}
          </div>
        ) : null}

        {headerMode === 'VIDEO_LOOP' ? (
          <div className="flex flex-col gap-3">
            {videoSlot}
            <div className="flex flex-col gap-2">
              <Eyebrow>Accents</Eyebrow>
              {brandRow}
              {accents}
            </div>
          </div>
        ) : null}

        {headerMode === 'SLIDESHOW' ? (
          <div className="flex flex-col gap-3">
            <Eyebrow>Slideshow</Eyebrow>
            {slideshowSlot}
            <div className="flex flex-col gap-2">
              <Eyebrow>Accents</Eyebrow>
              {brandRow}
              {accents}
            </div>
          </div>
        ) : null}
      </section>

      <BackdropBackgroundExtras
        useBackgroundGradient={useBackgroundGradient}
        onUseBackgroundGradient={onUseBackgroundGradient}
        backgroundScheme={backgroundScheme}
        onBackgroundSchemeChange={onBackgroundSchemeChange}
        backgroundVisualPreset={backgroundVisualPreset}
        onBackgroundVisualPreset={onBackgroundVisualPreset}
      />
    </div>
  );
}
