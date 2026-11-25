import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';

import { MarqueeText } from '@tahti-player/ui';

import { stubReducedMotion } from './_lib/motion';

const LONG =
  'Aamuyön valot ja kaikki muut kappaleet jotka eivät mahdu yhdelle riville';

const meta = {
  title: 'Components/MarqueeText',
  component: MarqueeText,
  args: { children: LONG, 'data-testid': 'marquee' },
  render: (args) => (
    <div className="w-56 p-4">
      <MarqueeText
        {...args}
        className="text-foreground text-sm font-semibold"
      />
    </div>
  ),
} satisfies Meta<typeof MarqueeText>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Text wider than its box loops sideways; hover pauses it. Only the first
 * copy is exposed to assistive tech. */
export const Overflowing: Story = {
  beforeEach: stubReducedMotion(false),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId('marquee');
    await waitFor(() =>
      expect(box).toHaveAttribute('data-marquee', 'scrolling'),
    );
    const copies = canvas.getAllByText(LONG);
    await expect(copies).toHaveLength(2);
    await expect(copies[1]).toHaveAttribute('aria-hidden', 'true');
    const track = box.querySelector<HTMLElement>('.tahti-marquee-track')!;
    await expect(
      track.style.getPropertyValue('--tahti-marquee-duration'),
    ).toMatch(/^\d+(\.\d+)?s$/);
  },
};

/** Text that fits never moves. */
export const Fits: Story = {
  args: { children: 'Night Drive' },
  beforeEach: stubReducedMotion(false),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('marquee')).toHaveAttribute(
      'data-marquee',
      'fits',
    );
    await expect(canvas.getAllByText('Night Drive')).toHaveLength(1);
  },
};

/** With reduced motion the overflowing line stays put and truncates. */
export const ReducedMotion: Story = {
  beforeEach: stubReducedMotion(true),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByTestId('marquee');
    await waitFor(() => expect(box).toHaveAttribute('data-marquee', 'static'));
    await expect(box.querySelector('.tahti-marquee-track')).toBeNull();
    const text = canvas.getByText(LONG);
    await expect(text).toHaveClass('truncate');
    await expect(text.scrollWidth).toBeGreaterThan(box.clientWidth);
  },
};
