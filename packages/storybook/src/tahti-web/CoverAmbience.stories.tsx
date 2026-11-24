import type { Meta, StoryObj } from '@storybook/react-vite';
import { CoverAmbience } from '@tahti-web/components/visuals/CoverAmbience';
import { expect, within } from 'storybook/test';

const COVER = '/artwork-presets/artwork-05.webp';

const meta: Meta<typeof CoverAmbience> = {
  title: 'Tahti/Player/CoverAmbience',
  component: CoverAmbience,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-screen player background built only from the cover art, chosen under Visualizer → Ambience. `glow` is the visualizer switched off (blurred cover with drifting colour light); `water` turns the upper part of the cover into a slowly panning landscape over its own rippling reflection. Both stay still under prefers-reduced-motion.',
      },
    },
  },
  args: { coverUrl: COVER, rgb: [236, 120, 60] },
  render: (args) => (
    <div className="relative h-[70vh] w-full">
      <CoverAmbience {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Glow: Story = {
  args: { variant: 'glow' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByTestId('cover-ambience'),
    ).toHaveAttribute('data-variant', 'glow');
  },
};

export const WaterLandscape: Story = {
  args: { variant: 'water' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('cover-ambience-land')).toBeVisible();
    await expect(canvas.getByTestId('cover-ambience-water')).toBeVisible();
  },
};
