import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelLayersMenu } from '@tahti-web/components/ChannelLayersMenu';
import {
  addItemType,
  addPlaylistItem,
  defaultChannelPageLayout,
  moveItem,
  setItemVisible,
  setItemWidth,
  type ChannelLayoutPresetId,
  type ChannelPageItem,
} from '@tahti-web/lib/channelPageLayout';
import { useState, type ComponentProps } from 'react';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';

import { MOCK_USERS, withMockAuth } from './_lib/decorators';

const EMBED_ITEMS = [
  {
    id: 'widget-bandcamp',
    label: 'Polar Drift on Bandcamp',
    hint: 'Bandcamp player',
    embedInstanceId: 'widget-bandcamp',
  },
  {
    id: 'widget-mixcloud',
    label: 'Aurora sessions on Mixcloud',
    hint: 'Mixcloud player',
    embedInstanceId: 'widget-mixcloud',
  },
];

const meta: Meta<typeof ChannelLayersMenu> = {
  title: 'Tahti/Channel/Designer/LayersMenu',
  component: ChannelLayersMenu,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withMockAuth(MOCK_USERS.artist)],
  args: {
    items: defaultChannelPageLayout(),
    selectedId: null,
    activePresetId: null,
    lookOpenSection: null,
    embedItems: EMBED_ITEMS,
    onSelect: fn(),
    onToggleVisible: fn(),
    onResize: fn(),
    onRemove: fn(),
    onAdd: fn(),
    onAddEmbed: fn(),
    onAddPlaylist: fn(),
    onReorder: fn(),
    onApplyPreset: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type MenuProps = ComponentProps<typeof ChannelLayersMenu>;

/** Full select / reorder / hide / resize / add / preset wiring against
 * local state, the same shape ChannelLayersPanel passes in. Every change is
 * also reported to the story's spies. */
function InteractiveMenu(args: MenuProps) {
  const [items, setItems] = useState<ChannelPageItem[]>(args.items);
  const [selectedId, setSelectedId] = useState<string | null>(args.selectedId);
  const [activePresetId, setActivePresetId] =
    useState<ChannelLayoutPresetId | null>(args.activePresetId);

  return (
    <div className="h-[32rem]">
      <ChannelLayersMenu
        {...args}
        items={items}
        selectedId={selectedId}
        activePresetId={activePresetId}
        onSelect={(id) => {
          setSelectedId(id);
          args.onSelect(id);
        }}
        onToggleVisible={(id) => {
          setItems((current) => {
            const row = current.find((i) => i.id === id);
            return setItemVisible(current, id, !row?.visible);
          });
          args.onToggleVisible(id);
        }}
        onResize={(id, width) => {
          setItems((current) => setItemWidth(current, id, width));
          args.onResize(id, width);
        }}
        onRemove={(id) => {
          setItems((current) => current.filter((i) => i.id !== id));
          args.onRemove(id);
        }}
        onAdd={(type) => {
          setItems((current) => addItemType(current, type));
          args.onAdd(type);
        }}
        onAddEmbed={(embedInstanceId) => {
          setItems((current) => [
            ...current,
            {
              id: `embed-${embedInstanceId}`,
              type: 'embed',
              embedInstanceId,
              visible: true,
            },
          ]);
          args.onAddEmbed?.(embedInstanceId);
        }}
        onAddPlaylist={(playlistSlug) => {
          setItems((current) => addPlaylistItem(current, playlistSlug));
          args.onAddPlaylist?.(playlistSlug);
        }}
        onReorder={(fromId, toId) => {
          setItems((current) => moveItem(current, fromId, toId));
          args.onReorder(fromId, toId);
        }}
        onApplyPreset={(id) => {
          setActivePresetId(id);
          args.onApplyPreset(id);
        }}
      />
    </div>
  );
}

function layerRow(canvas: ReturnType<typeof within>, name: RegExp) {
  const row = canvas.getByRole('button', { name }).closest('li');
  if (!row) {
    throw new Error(`No layer row for ${String(name)}`);
  }
  return row;
}

function layerOrder(canvasElement: HTMLElement) {
  return Array.from(
    canvasElement.querySelectorAll('[data-testid="channel-layers-menu"] li'),
  ).map((row) => row.textContent ?? '');
}

export const Interactive: Story = {
  name: 'Interactive (reorder, hide, resize, add)',
  render: (args) => <InteractiveMenu {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /^Tahti/ }));
    await expect(args.onApplyPreset).toHaveBeenCalledWith('tahti');

    await expect(layerOrder(canvasElement)[1]).toMatch(/^Live stage/);
    const tracks = layerRow(canvas, /^Tracks/);
    const stage = layerRow(canvas, /^Live stage/);
    fireEvent.dragStart(tracks);
    fireEvent.dragOver(stage);
    fireEvent.drop(stage);
    await expect(args.onReorder).toHaveBeenCalledWith('sound', 'hero');
    await expect(layerOrder(canvasElement)[1]).toMatch(/^Tracks/);

    const tracksRow = within(layerRow(canvas, /^Tracks/));
    await userEvent.click(tracksRow.getByRole('button', { name: 'Hide' }));
    await expect(args.onToggleVisible).toHaveBeenCalledWith('sound');
    await expect(tracksRow.getByRole('button', { name: 'Show' })).toBeVisible();

    await userEvent.click(
      tracksRow.getByRole('button', { name: 'compact width for Tracks' }),
    );
    await expect(args.onResize).toHaveBeenCalledWith('sound', 'compact');
    await expect(
      tracksRow.getByRole('button', { name: 'compact width for Tracks' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await userEvent.click(
      canvas.getByRole('button', { name: /Polar Drift on Bandcamp/ }),
    );
    await expect(args.onAddEmbed).toHaveBeenCalledWith('widget-bandcamp');
    await expect(
      canvas.getByRole('button', { name: /^External embed/ }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Add playlist' }),
    );
    await expect(args.onAddPlaylist).toHaveBeenCalled();

    await userEvent.click(
      within(layerRow(canvas, /^Live stage/)).getByRole('button', {
        name: 'Remove from page',
      }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith('hero');
  },
};

export const LookPanel: Story = {
  name: 'Look panel (lookSlot content)',
  args: {
    selectedId: 'hero',
    activePresetId: 'tahti',
    lookOpenSection: 'player',
    lookSlot: (
      <p className="text-foreground-secondary text-xs">
        The channel-design &quot;Look&quot; controls (from ChannelDesigner
        lookOnly=true) dock into this panel; see the Designer/LayersPanel story
        for the real wiring.
      </p>
    ),
  },
  render: (args) => (
    <div className="h-[32rem]">
      <ChannelLayersMenu {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/dock into this panel/),
    ).toBeInTheDocument();
  },
};

export const EverythingOnPage: Story = {
  name: 'Add tab: every block already on the page',
  args: {
    items: defaultChannelPageLayout().map((item) => ({
      ...item,
      visible: true,
    })),
    embedItems: [],
  },
  render: (args) => <InteractiveMenu {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await expect(
      canvas.getByText('Every block type is already on the page.'),
    ).toBeVisible();
  },
};
