import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Skeleton } from '@tahti-player/ui';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Placeholder shapes on the control surface while content loads. `block` fills the box you size with `className`; `line` is a text-height bar (`lines` stacks several). Pulses unless the user prefers reduced motion. Hidden from assistive tech: put `aria-busy` and a label on the loading region.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Block: Story = {
  args: { className: 'h-32 w-64' },
};

export const Lines: Story = {
  args: { shape: 'line', lines: 3, className: 'w-72' },
};

export const Card: Story = {
  render: () => (
    <section
      aria-busy="true"
      aria-label="Loading show info"
      className="border-border-subtle rounded-card flex w-80 gap-3 border p-4"
    >
      <Skeleton className="size-16 shrink-0" />
      <Skeleton shape="line" lines={3} className="flex-1" />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Loading show info' });
    await expect(region).toHaveAttribute('aria-busy', 'true');
    const shapes = canvas.getAllByTestId('skeleton');
    await expect(shapes).toHaveLength(2);
    for (const shape of shapes) {
      await expect(shape).toHaveAttribute('aria-hidden', 'true');
    }
    const bar = shapes[1]!.firstElementChild!;
    await expect(getComputedStyle(bar).backgroundColor).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
  },
};
