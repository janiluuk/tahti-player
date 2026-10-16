import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import type { ChannelGalleryMode } from '@tahti-web/api/channel-gallery';
import { BackdropPanel } from '@tahti-web/components/channel-designer/BackdropPanel';
import type { HeaderDesignMode } from '@tahti-web/components/channel-designer/HeaderStyleTabs';
import { SlideshowControls } from '@tahti-web/components/channel-designer/SlideshowControls';
import { useState } from 'react';

import {
  LONG_SLIDESHOW_IMAGES,
  MockBackdropUploadProgress,
} from './_fixtures/channel-designer-backdrop';

/**
 * Full Look → Background panel with exclusive header-style bodies.
 * Video/Slideshow slots are mocked here; live ChannelDesigner owns uploads.
 *
 * Missing states: YouTube embed preview.
 */
const meta: Meta<typeof BackdropPanel> = {
  title: 'Tahti/Channel/Designer/BackdropPanel',
  component: BackdropPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const initialScheme: ColorScheme = {
  accent: '#22D3EE',
  highlight: '#A78BFA',
  bg: '#0B1220',
  text: '#F8FAFC',
  muted: '#64748B',
};

function Demo({ mode }: { mode: HeaderDesignMode }) {
  const [headerMode, setHeaderMode] = useState<HeaderDesignMode>(mode);
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);
  const [backgroundScheme, setBackgroundScheme] =
    useState<ColorScheme>(initialScheme);
  const [useBackgroundGradient, setUseBackgroundGradient] = useState(false);
  const [brandAccentPreset, setBrandAccentPreset] = useState<string | null>(
    'aurora',
  );
  const [backgroundVisualPreset, setBackgroundVisualPreset] =
    useState('INTERACTIVE_POINTS');

  return (
    <div className="border-border bg-background/80 max-w-md rounded-xl border p-3 backdrop-blur-md">
      <BackdropPanel
        scheme={scheme}
        backgroundScheme={backgroundScheme}
        useBackgroundGradient={useBackgroundGradient}
        brandAccentPreset={brandAccentPreset}
        headerMode={headerMode}
        hasBackdrop={headerMode === 'VIDEO_LOOP' || headerMode === 'SLIDESHOW'}
        backgroundVisualPreset={backgroundVisualPreset}
        onPageBackgroundChange={(bg) => {
          if (useBackgroundGradient) {
            setBackgroundScheme((current) => ({ ...current, bg }));
            return;
          }
          setScheme((current) => ({ ...current, bg }));
          setBrandAccentPreset(null);
        }}
        onHeaderModeChange={setHeaderMode}
        onRemoveBackdrop={() => setHeaderMode('SOLID')}
        onSchemeChange={(next) => {
          setScheme(next);
          setBrandAccentPreset(null);
        }}
        onBrandAccent={(brand) => {
          setBrandAccentPreset(brand.id);
          setScheme((current) => ({
            ...current,
            accent: brand.accent,
            highlight: brand.highlight,
          }));
        }}
        onUseBackgroundGradient={setUseBackgroundGradient}
        onBackgroundSchemeChange={setBackgroundScheme}
        onBackgroundVisualPreset={setBackgroundVisualPreset}
        videoSlot={
          <p className="text-foreground-secondary text-xs">
            Video upload slot (mock) — live designer mounts FilePicker here.
          </p>
        }
        slideshowSlot={
          <p className="text-foreground-secondary text-xs">
            Slideshow controls slot (mock).
          </p>
        }
      />
    </div>
  );
}

function SlideshowLongStripDemo() {
  const [headerMode, setHeaderMode] = useState<HeaderDesignMode>('SLIDESHOW');
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);
  const [backgroundScheme, setBackgroundScheme] =
    useState<ColorScheme>(initialScheme);
  const [useBackgroundGradient, setUseBackgroundGradient] = useState(false);
  const [brandAccentPreset, setBrandAccentPreset] = useState<string | null>(
    'aurora',
  );
  const [backgroundVisualPreset, setBackgroundVisualPreset] =
    useState('INTERACTIVE_POINTS');
  const [images, setImages] = useState(LONG_SLIDESHOW_IMAGES);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState<ChannelGalleryMode>('STATIC_SLIDESHOW');
  const [preset, setPreset] = useState('FADE');
  const [interval, setInterval] = useState(8);
  const [transition, setTransition] = useState(600);
  const [autoplay, setAutoplay] = useState(true);

  return (
    <div className="border-border bg-background/80 max-w-md rounded-xl border p-3 backdrop-blur-md">
      <BackdropPanel
        scheme={scheme}
        backgroundScheme={backgroundScheme}
        useBackgroundGradient={useBackgroundGradient}
        brandAccentPreset={brandAccentPreset}
        headerMode={headerMode}
        hasBackdrop
        backgroundVisualPreset={backgroundVisualPreset}
        onPageBackgroundChange={(bg) => {
          if (useBackgroundGradient) {
            setBackgroundScheme((current) => ({ ...current, bg }));
            return;
          }
          setScheme((current) => ({ ...current, bg }));
          setBrandAccentPreset(null);
        }}
        onHeaderModeChange={setHeaderMode}
        onRemoveBackdrop={() => setHeaderMode('SOLID')}
        onSchemeChange={(next) => {
          setScheme(next);
          setBrandAccentPreset(null);
        }}
        onBrandAccent={(brand) => {
          setBrandAccentPreset(brand.id);
          setScheme((current) => ({
            ...current,
            accent: brand.accent,
            highlight: brand.highlight,
          }));
        }}
        onUseBackgroundGradient={setUseBackgroundGradient}
        onBackgroundSchemeChange={setBackgroundScheme}
        onBackgroundVisualPreset={setBackgroundVisualPreset}
        videoSlot={null}
        slideshowSlot={
          <div className="flex flex-col gap-3">
            <SlideshowControls
              images={images}
              previewIndex={previewIndex}
              onPreviewIndexChange={setPreviewIndex}
              busy={false}
              onReorder={(from, to) =>
                setImages((current) => {
                  const next = [...current];
                  const [moved] = next.splice(from, 1);
                  if (moved) {
                    next.splice(to, 0, moved);
                  }
                  return next;
                })
              }
              onRemove={(index) =>
                setImages((current) => current.filter((_, i) => i !== index))
              }
              pickerOpen={pickerOpen}
              onPickerOpenChange={setPickerOpen}
              pickedFiles={[]}
              onFilesPicked={() => Promise.resolve()}
              galleryMode={mode}
              onGalleryModeChange={setMode}
              preset={preset}
              onPresetChange={setPreset}
              interval={interval}
              onIntervalChange={setInterval}
              transition={transition}
              onTransitionChange={setTransition}
              autoplay={autoplay}
              onAutoplayChange={setAutoplay}
            />
            <MockBackdropUploadProgress progress={0.67} />
          </div>
        }
      />
    </div>
  );
}

export const Gradient: Story = {
  render: () => <Demo mode="GRADIENT" />,
};

export const Solid: Story = {
  render: () => <Demo mode="SOLID" />,
};

export const VideoLoop: Story = {
  name: 'Video / image',
  render: () => <Demo mode="VIDEO_LOOP" />,
};

export const Slideshow: Story = {
  render: () => <Demo mode="SLIDESHOW" />,
};

export const SlideshowLongStrip: Story = {
  name: 'Slideshow — long strip + upload progress',
  render: () => <SlideshowLongStripDemo />,
};

export const Visualization: Story = {
  render: () => <Demo mode="VISUALIZATION" />,
};
