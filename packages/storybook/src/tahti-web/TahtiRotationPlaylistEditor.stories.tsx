import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AdminSelectsItem } from '@tahti-web/api/admin';
import { TahtiRotationPlaylistEditor } from '@tahti-web/components/TahtiRotationPlaylistEditor';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta: Meta<typeof TahtiRotationPlaylistEditor> = {
  title: 'Tahti/Studio/TahtiRotationPlaylistEditor',
  component: TahtiRotationPlaylistEditor,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onReorder: fn(),
    onRemove: fn(),
    onPreview: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const items: AdminSelectsItem[] = [
  {
    id: 'selects-1',
    soundId: 'archive-item-1',
    title: 'Aurora',
    durationSec: 214,
    license: 'CC_BY',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    addedBy: 'board-jani',
  },
  {
    id: 'selects-2',
    soundId: 'archive-item-2',
    title: 'Frost Line',
    durationSec: 198,
    license: 'CC0',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    addedBy: 'board-jani',
  },
  {
    id: 'selects-3',
    soundId: 'archive-item-4',
    title: 'Midnight Frequency',
    durationSec: 301,
    license: 'ALL_RIGHTS_RESERVED',
    artistName: 'Northern Lights',
    channelSlug: 'northern-lights',
    addedBy: 'listener-liina',
  },
];

export const Default: Story = {
  args: { items },
};

export const Empty: Story = {
  args: { items: [] },
};

export const Busy: Story = {
  args: { items, busy: true },
};

export const LongList: Story = {
  args: {
    items: Array.from({ length: 24 }, (_, index) => ({
      id: `selects-long-${index}`,
      soundId: `archive-long-${index}`,
      title: `Rotation track ${index + 1}`,
      durationSec: 180 + index,
      license: index % 2 === 0 ? 'CC_BY' : 'CC0',
      artistName: 'Northern Lights',
      channelSlug: 'northern-lights',
      addedBy: 'board-jani',
    })),
  },
};

export const ReadOnly: Story = {
  args: { items, readOnly: true },
};

export const OnAir: Story = {
  name: 'On air and up next',
  args: { items, nowPlayingItemId: 'selects-2' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('On air')).toBeVisible();
    await expect(canvas.getByText('Up next')).toBeVisible();
    const rows = canvas.getAllByTestId('track-row');
    await expect(rows[1]).toHaveAttribute('aria-current', 'true');
    await expect(within(rows[0]!).getByText('1')).toBeVisible();
  },
};

export const MoveFromRowMenu: Story = {
  name: 'Move a track from its row menu',
  args: { items },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const [firstRow] = canvas.getAllByTestId('track-row');
    await userEvent.click(
      within(firstRow!).getByTestId('track-context-menu-button'),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByTestId('rotation-move-down'));
    await expect(args.onReorder).toHaveBeenCalledWith([
      items[1],
      items[0],
      items[2],
    ]);
  },
};

export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
  args: { items, nowPlayingItemId: 'selects-1' },
  render: (args) => (
    <div className="w-[358px]">
      <TahtiRotationPlaylistEditor {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table');
    await expect(table.scrollWidth).toBeLessThanOrEqual(table.clientWidth + 1);
    await expect(
      canvas.getAllByTestId('track-context-menu-button'),
    ).toHaveLength(items.length);
  },
};
