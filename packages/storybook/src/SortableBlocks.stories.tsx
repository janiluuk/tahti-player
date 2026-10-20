import { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';

import { Button, SortableBlocks, type SortableBlock } from '@tahti-player/ui';

import { keyboardMoveDown } from './tahti-web/_lib/play';

const meta = {
  title: 'Components/SortableBlocks',
  component: SortableBlocks,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A vertical stack of page blocks. With `reordering` on, each block gets a dashed frame and a drag handle; drag with the pointer, or focus a handle and use Space, the arrow keys and Space again.',
      },
    },
  },
} satisfies Meta<typeof SortableBlocks>;

export default meta;

type Story = StoryObj<typeof SortableBlocks>;

const panel = (text: string) => (
  <div className="border-border bg-background-secondary rounded-md border p-4 text-sm">
    {text}
  </div>
);

const BLOCKS: SortableBlock[] = [
  { id: 'radio', label: 'Tahti Radio', content: panel('24/7 stream') },
  { id: 'live', label: 'Live now', content: panel('Channels on air') },
  { id: 'news', label: 'News', content: panel('Latest posts') },
];

function OrderableStack({
  initiallyReordering,
}: {
  initiallyReordering: boolean;
}) {
  const [reordering, setReordering] = useState(initiallyReordering);
  const [order, setOrder] = useState(BLOCKS.map((block) => block.id));
  const blocks = order.map((id) => BLOCKS.find((block) => block.id === id)!);
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Button
        variant="secondary"
        aria-pressed={reordering}
        onClick={() => setReordering((on) => !on)}
      >
        {reordering ? 'Done' : 'Order'}
      </Button>
      <SortableBlocks
        blocks={blocks}
        reordering={reordering}
        onReorder={setOrder}
      />
    </div>
  );
}

export const Plain: Story = {
  render: () => <OrderableStack initiallyReordering={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('24/7 stream')).toBeVisible();
    await expect(canvas.queryByRole('button', { name: /^Move / })).toBeNull();
  },
};

export const Reordering: Story = {
  render: () => <OrderableStack initiallyReordering />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole('button', { name: 'Move Tahti Radio' });
    await keyboardMoveDown(handle);
    await waitFor(() => {
      const ids = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[data-sortable-block]'),
      ).map((node) => node.dataset.sortableBlock);
      expect(ids).toEqual(['live', 'radio', 'news']);
    });
  },
};
