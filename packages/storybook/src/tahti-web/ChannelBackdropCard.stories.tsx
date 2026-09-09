import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelBackdropCard } from '@tahti-web/components/ChannelBackdropCard';

const meta: Meta<typeof ChannelBackdropCard> = {
  title: 'Tahti/Channel/ChannelBackdropCard',
  component: ChannelBackdropCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    displayName: 'Northern Lights',
    username: 'northern-lights',
    channelSlug: 'northern-lights',
    bio: 'Ambient / downtempo, streaming most weeknights.',
    accent: '#22D3EE',
    highlight: '#A78BFA',
    bg: '#120B08',
    fg: '#FFF7ED',
    visualPreset: 'AURORA',
    minHeightClassName: 'min-h-96',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {
  args: {
    headerStyle: 'GRADIENT',
  },
};

export const Solid: Story = {
  args: {
    headerStyle: 'SOLID',
  },
};

export const VisualizerFallback: Story = {
  name: 'Visualizer fallback (no header style set)',
  args: {
    headerStyle: '',
    artworkUrl: 'https://picsum.photos/seed/tahti-channel/512',
  },
};

export const Editable: Story = {
  name: 'Editable (Channel Designer preview)',
  args: {
    headerStyle: 'GRADIENT',
    editable: true,
    identitySelected: true,
    onEditIdentity: () => {},
    onEditBackground: () => {},
    badge: (
      <span className="bg-primary text-primary-foreground rounded px-2 py-1 text-[10px] font-bold tracking-wide uppercase">
        Live
      </span>
    ),
  },
};

const SLIDESHOW_IMAGES = [
  'https://picsum.photos/seed/tahti-slide-1/800/450',
  'https://picsum.photos/seed/tahti-slide-2/800/450',
  'https://picsum.photos/seed/tahti-slide-3/800/450',
];

/** `galleryMode: 'STATIC_SLIDESHOW'` — until this pass, no story ever
 * exercised this mode at all, matching the real bug it shipped with: the
 * component only ever rendered `slideshowImages[0]` and ignored every
 * slideshow setting below. Short interval/transition here so the effect is
 * visible within a few seconds instead of the real ~8s default. */
export const Slideshow: Story = {
  name: 'Slideshow (rotating, preset-selectable)',
  args: {
    headerStyle: '',
    galleryMode: 'STATIC_SLIDESHOW',
    slideshowImages: SLIDESHOW_IMAGES,
    slideshowPreset: 'FADE',
    slideshowIntervalSeconds: 3,
    slideshowTransitionMs: 700,
    slideshowAutoplay: true,
  },
  argTypes: {
    slideshowPreset: {
      control: 'select',
      options: [
        'FADE',
        'ZOOM',
        'PAN',
        'BLUR_CROSS',
        'PARTICLE_DISSOLVE',
        'GLITCH_WIPE',
        'CUBE_FLIP',
        'LIQUID_DISTORTION',
      ],
    },
  },
};

export const SlideshowGlitchWipe: Story = {
  name: 'Slideshow — Glitch wipe (WebGL)',
  args: {
    ...Slideshow.args,
    slideshowPreset: 'GLITCH_WIPE',
  },
};

export const SlideshowCubeFlip: Story = {
  name: 'Slideshow — Cube flip (WebGL)',
  args: {
    ...Slideshow.args,
    slideshowPreset: 'CUBE_FLIP',
  },
};

export const SlideshowAutoplayOff: Story = {
  name: 'Slideshow — autoplay off (static on first image)',
  args: {
    ...Slideshow.args,
    slideshowAutoplay: false,
  },
};

export const WarmPalette: Story = {
  name: 'Color scheme — warm',
  args: {
    headerStyle: 'GRADIENT',
    bg: '#3B0A0A',
    accent: '#F97316',
    highlight: '#FACC15',
    fg: '#FFF7ED',
  },
};

export const CoolPalette: Story = {
  name: 'Color scheme — cool',
  args: {
    headerStyle: 'GRADIENT',
    bg: '#0B1120',
    accent: '#38BDF8',
    highlight: '#818CF8',
    fg: '#E0F2FE',
  },
  parameters: { backgrounds: { default: 'dark' } },
};
