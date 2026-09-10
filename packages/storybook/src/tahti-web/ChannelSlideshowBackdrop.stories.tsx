import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelSlideshowBackdrop } from '@tahti-web/components/ChannelSlideshowBackdrop';

const IMAGES = [
  'https://picsum.photos/seed/tahti-slide-1/800/450',
  'https://picsum.photos/seed/tahti-slide-2/800/450',
  'https://picsum.photos/seed/tahti-slide-3/800/450',
];

const PRESETS = [
  'FADE',
  'ZOOM',
  'PAN',
  'BLUR_CROSS',
  'PARTICLE_DISSOLVE',
  'GLITCH_WIPE',
  'CUBE_FLIP',
  'LIQUID_DISTORTION',
] as const;

/** The channel backdrop's rotating-image primitive — the 4 CSS presets
 * (FADE/ZOOM/PAN/BLUR_CROSS) crossfade two stacked `<img>` layers; the other
 * 4 (PARTICLE_DISSOLVE/GLITCH_WIPE/CUBE_FLIP/LIQUID_DISTORTION) are WebGL
 * shaders ported from `../tahti-org`'s slideshow-transitions. Short interval
 * / transition here (real default: 8s / 600ms) so every effect is visible
 * within a couple of seconds instead of waiting out the real timing. */
const meta: Meta<typeof ChannelSlideshowBackdrop> = {
  title: 'Tahti/Channel/ChannelSlideshowBackdrop',
  component: ChannelSlideshowBackdrop,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <Story />
      </div>
    ),
  ],
  args: {
    images: IMAGES,
    intervalSeconds: 3,
    transitionMs: 700,
    autoplay: true,
  },
  argTypes: {
    preset: { control: 'select', options: PRESETS },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Fade: Story = { args: { preset: 'FADE' } };
export const Zoom: Story = { args: { preset: 'ZOOM' } };
export const Pan: Story = { args: { preset: 'PAN' } };
export const BlurCross: Story = { args: { preset: 'BLUR_CROSS' } };
export const ParticleDissolve: Story = {
  args: { preset: 'PARTICLE_DISSOLVE' },
};
export const GlitchWipe: Story = { args: { preset: 'GLITCH_WIPE' } };
export const CubeFlip: Story = { args: { preset: 'CUBE_FLIP' } };
export const LiquidDistortion: Story = {
  args: { preset: 'LIQUID_DISTORTION' },
};

export const SingleImage: Story = {
  name: 'Single image (no rotation)',
  args: { images: [IMAGES[0]!], preset: 'FADE' },
};

export const AutoplayOff: Story = {
  name: 'Autoplay off (static on first image)',
  args: { preset: 'FADE', autoplay: false },
};
