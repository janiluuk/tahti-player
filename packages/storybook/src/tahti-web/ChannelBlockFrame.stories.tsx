import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelBlockFrame } from '@tahti-web/components/channel-view';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof ChannelBlockFrame> = {
  title: 'Tahti/Channel/ChannelBlockFrame',
  component: ChannelBlockFrame,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wraps one block on the channel page. In edit mode it is selectable, draggable to reorder, has a grip to place it freely (snapped to a 16px grid) and a remove button; on the public page it only sets the block width.',
      },
    },
  },
  args: {
    item: { id: 'links-1', type: 'links', visible: true },
    editing: true,
    selected: false,
    dragId: null,
    setDragId: fn(),
    moveDrag: null,
    setMoveDrag: fn(),
    onSelect: fn(),
    updateLayout: fn(),
    onRemove: fn(),
    children: (
      <div className="border-border rounded-lg border px-4 py-3 text-sm">
        Links block content
      </div>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Editing: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('· drag to place')).toBeVisible();
    await userEvent.click(canvas.getByText('Links block content'));
    await expect(args.onSelect).toHaveBeenCalledWith('links-1');
    const remove = canvas.getByRole('button', { name: /^Remove / });
    await userEvent.click(remove);
    await expect(args.onRemove).toHaveBeenCalledWith('links-1');
    await expect(args.onSelect).toHaveBeenCalledOnce();
  },
};

export const HiddenAndPlaced: Story = {
  args: {
    selected: true,
    item: {
      id: 'stats-1',
      type: 'stats',
      visible: false,
      width: 'compact',
      offsetX: 32,
      offsetY: 16,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('(hidden)')).toBeVisible();
    const frame =
      canvasElement.querySelector<HTMLElement>('[draggable="true"]');
    await expect(frame?.style.transform).toBe('translate(32px, 16px)');
    await expect(frame).toHaveClass('w-[65%]');
  },
};

export const PublicPage: Story = {
  args: {
    editing: false,
    item: { id: 'links-1', type: 'links', visible: true, width: 'wide' },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('· drag to place')).toBeNull();
    await expect(canvas.queryByRole('button')).toBeNull();
    await userEvent.click(canvas.getByText('Links block content'));
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
