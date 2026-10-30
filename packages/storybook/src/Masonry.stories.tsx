import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Masonry } from '@tahti-player/ui';

const HEIGHTS = [180, 320, 140, 260, 200, 120, 300];

const meta = {
  title: 'Layout/Masonry',
  component: Masonry,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Independent columns (1 / 2 at md / 3 at xl) so variable-height panels never leave gaps. Children are dealt round-robin, so order reads left to right. Used for the Discover widget panels.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    children: HEIGHTS.map((height, index) => (
      <div
        key={index}
        className="border-border bg-background-secondary rounded-md border p-3 text-sm"
        style={{ height }}
      >
        Panel {index + 1}
      </div>
    )),
  },
} satisfies Meta<typeof Masonry>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each column stacks tightly: the gap between panels is the same 8px in
 * every column, whatever their heights. */
export const VariableHeights: Story = {
  play: async ({ canvasElement }) => {
    const columns = within(canvasElement).getAllByTestId('masonry-column');
    for (const column of columns) {
      const panels = Array.from(column.children) as HTMLElement[];
      for (let index = 1; index < panels.length; index++) {
        const gap =
          panels[index].getBoundingClientRect().top -
          panels[index - 1].getBoundingClientRect().bottom;
        await expect(Math.round(gap)).toBe(8);
      }
    }
  },
};
