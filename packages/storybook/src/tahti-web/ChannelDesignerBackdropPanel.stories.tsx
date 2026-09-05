import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ColorScheme } from '@tahti-web/api/channel-design';
import { BackdropPanel } from '@tahti-web/components/channel-designer/BackdropPanel';
import type { HeaderDesignMode } from '@tahti-web/components/channel-designer/HeaderStyleTabs';
import { useState } from 'react';

/**
 * Full Look → Background panel with exclusive header-style bodies.
 * Video/Slideshow slots are mocked here; live ChannelDesigner owns uploads.
 *
 * Missing states: long slideshow strip, upload progress, YouTube embed preview.
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

export const Visualization: Story = {
  render: () => <Demo mode="VISUALIZATION" />,
};
