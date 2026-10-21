import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelVisualizer } from '@tahti-web/components/ChannelVisualizer';

/**
 * Renders the real, animating Three.js visualizer (lazy-loaded
 * `visuals/ThreeVisualizer`) — no analyser is connected in Storybook
 * (that only exists once AudioEngine has a playing `<audio>` element), so
 * every preset animates using its idle/silent-input motion rather than
 * reacting to live audio levels. MINIMAL renders the plain CSS gradient
 * fallback used whenever WebGL is unavailable or reduced-motion is on.
 */
const meta: Meta<typeof ChannelVisualizer> = {
  title: 'Tahti/Channel/ChannelVisualizer',
  component: ChannelVisualizer,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  render: (args) => (
    <div className="h-64 w-full overflow-hidden rounded-xl">
      <ChannelVisualizer {...args} className="h-full w-full" />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Aurora: Story = {
  args: {
    preset: 'AURORA',
  },
};

export const WaveformBars: Story = {
  args: {
    preset: 'WAVEFORM_BARS',
  },
};

export const ParticleField: Story = {
  args: {
    preset: 'PARTICLE_FIELD',
  },
};

export const ReactiveGrid: Story = {
  args: {
    preset: 'REACTIVE_GRID',
  },
};

export const Minimal: Story = {
  name: 'Minimal (CSS gradient fallback)',
  args: {
    preset: 'MINIMAL',
  },
};

export const CustomColorScheme: Story = {
  args: {
    preset: 'AURORA',
    colorScheme: {
      accent: '#F97316',
      highlight: '#FBBF24',
      bg: '#120B08',
      text: '#FFF7ED',
    },
  },
};

export const WithArtwork: Story = {
  args: {
    preset: 'LENS_FLARES',
    artworkUrl: 'https://picsum.photos/seed/tahti-channel/512',
  },
};

export const SavedSettingsJson: Story = {
  name: 'Saved look JSON (colorSchemeJson + visualSettingsJson)',
  args: {
    preset: 'PARTICLE_FIELD',
    colorSchemeJson: JSON.stringify({
      accent: '#A855F7',
      highlight: '#EC4899',
      bg: '#140A1F',
      text: '#FAF5FF',
    }),
    visualSettingsJson: JSON.stringify({
      PARTICLE_FIELD: { speed: 1.6, intensity: 1.4, audioReactive: false },
    }),
  },
};

export const SettingsOverride: Story = {
  name: 'Live tuning override (settings)',
  args: {
    preset: 'WAVEFORM_BARS',
    settings: { speed: 0.5, intensity: 2, scale: 1.4 },
  },
};

export const AudioReactiveOff: Story = {
  name: 'Audio reactive forced off (ambient background)',
  args: {
    preset: 'INTERACTIVE_POINTS',
    audioReactive: false,
    visualSettingsJson: JSON.stringify({
      INTERACTIVE_POINTS: { audioReactive: true },
    }),
  },
};
