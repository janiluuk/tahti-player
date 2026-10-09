import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChannelLink } from '@tahti-web/api/channel-design';
import { mockChannel } from '@tahti-web/api/mock';
import { ChannelLayersPanel } from '@tahti-web/components/channel-view/ChannelLayersPanel';
import type { ChannelDesignerHandle } from '@tahti-web/components/ChannelDesigner';
import type {
  ChannelLayoutPresetId,
  ChannelPageItem,
} from '@tahti-web/lib/channelPageLayout';
import { useRef, useState, type ComponentProps, type RefObject } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import {
  channelDesignMockData,
  DESIGN_LINKS,
  DESIGN_SLUG,
  designLayout,
  restoreChannelDesignState,
} from './_fixtures/channel-design';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const EMBED_ITEMS = [
  {
    id: 'widget-bandcamp',
    label: 'Polar Drift on Bandcamp',
    hint: 'Bandcamp player',
    embedInstanceId: 'widget-bandcamp',
  },
];

type Props = ComponentProps<typeof ChannelLayersPanel>;

/** The Look panel fades in on the next frame after a selection. */
const fadedIn = (element: HTMLElement) =>
  waitFor(() => expect(element).toBeVisible());

/** Owns the layout / selection / links state the way ChannelView's
 * editing mode does, and reports every change to the story's spies. */
function LayersPanelDemo(args: Props) {
  const [layout, setLayout] = useState<ChannelPageItem[]>(args.layout);
  const [selectedId, setSelectedId] = useState<string | null>(args.selectedId);
  const [presetId, setPresetId] = useState<ChannelLayoutPresetId | null>(
    args.activePresetId,
  );
  const [links, setLinks] = useState<ChannelLink[]>(args.links);
  const designerRef = useRef<ChannelDesignerHandle>(
    null,
  ) as RefObject<ChannelDesignerHandle>;
  return (
    <div className="h-[44rem]">
      <ChannelLayersPanel
        {...args}
        layout={layout}
        updateLayout={(updater) => {
          setLayout(updater);
          args.updateLayout(updater);
        }}
        removeLayoutItem={(id) => {
          setLayout((current) => current.filter((item) => item.id !== id));
          args.removeLayoutItem(id);
        }}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          args.onSelect(id);
        }}
        activePresetId={presetId}
        onApplyPreset={(id) => {
          setPresetId(id);
          args.onApplyPreset(id);
        }}
        links={links}
        onLinksChange={(next) => {
          setLinks(next);
          args.onLinksChange(next);
        }}
        designerRef={designerRef}
      />
    </div>
  );
}

/** ChannelView's editing side panel: the layers menu plus each selected
 * block's own controls (links, playlist, feed, navigation, or the look
 * designer for the stage / background / tracks). */
const meta: Meta<typeof ChannelLayersPanel> = {
  title: 'Tahti/Channel/Designer/LayersPanel',
  component: ChannelLayersPanel,
  parameters: { layout: 'padded', mockData: channelDesignMockData() },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter(`/channel/${DESIGN_SLUG}`),
    withMockAuth(MOCK_USERS.artist),
  ],
  beforeEach: () => restoreChannelDesignState(),
  args: {
    channel: mockChannel(DESIGN_SLUG),
    slug: DESIGN_SLUG,
    layout: designLayout(),
    selectedId: null,
    activePresetId: 'tahti',
    embedItems: EMBED_ITEMS,
    links: DESIGN_LINKS,
    presetLook: null,
    lookTick: 0,
    updateLayout: fn(),
    removeLayoutItem: fn(),
    onSelect: fn(),
    onApplyPreset: fn(),
    onLinksChange: fn(),
    onLookDirtyChange: fn(),
    onLookSaved: fn(),
  },
  render: (args) => <LayersPanelDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EveryBlockPanel: Story = {
  name: 'Every block panel',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const openLayer = async (name: RegExp) => {
      await userEvent.click(canvas.getByRole('button', { name: 'Layers' }));
      await userEvent.click(canvas.getByRole('button', { name }));
    };

    await openLayer(/^Links/);
    await fadedIn(await canvas.findByDisplayValue('Bandcamp'));
    await userEvent.click(canvas.getByRole('button', { name: 'Add link' }));
    await expect(args.onLinksChange).toHaveBeenCalled();

    await openLayer(/^Navigation/);
    await fadedIn(await canvas.findByDisplayValue('Stage'));
    await fadedIn(
      canvas.getByRole('group', { name: 'Sections shown under Music' }),
    );

    await openLayer(/^Feed/);
    const releases = await canvas.findByRole('switch', { name: 'Releases' });
    await userEvent.click(releases);
    await expect(releases).not.toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Cards' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await openLayer(/^Playlist/);
    await fadedIn(
      await canvas.findByText('Choose which playlist this block shows.'),
    );

    await openLayer(/^Live stage/);
    await fadedIn(await canvas.findByTestId('channel-player-panel'));

    await openLayer(/^Background/);
    await fadedIn(await canvas.findByTestId('channel-backdrop-panel'));
    await expect(
      canvas.getByRole('switch', { name: 'Show Subscribe button' }),
    ).not.toBeChecked();
    await expect(args.onSelect).toHaveBeenLastCalledWith('header');
  },
};

export const AddEmbedAndBlock: Story = {
  name: 'Add an embed and a hidden block',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await userEvent.click(
      canvas.getByRole('button', { name: /Polar Drift on Bandcamp/ }),
    );
    await expect(
      canvas.getByRole('button', { name: /^External embed/ }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Add' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Chat' }));
    await expect(canvas.getByRole('button', { name: /^Chat/ })).toBeVisible();
    await expect(args.updateLayout).toHaveBeenCalledTimes(2);
  },
};

export const ApplyPreset: Story = {
  name: 'Apply a layout preset',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Subtle \/ Solid/ }),
    );
    await expect(args.onApplyPreset).toHaveBeenCalledWith('subtle');
    await expect(
      canvas.getByRole('button', { name: /^Background/ }),
    ).toBeVisible();
  },
};
