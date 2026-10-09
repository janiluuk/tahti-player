import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelDesigner } from '@tahti-web/components/ChannelDesigner';
import { RightRailPanel } from '@tahti-web/components/RightRailPanel';
import {
  CHANNEL_LOOK_ELEMENTS,
  type ChannelLookElementId,
} from '@tahti-web/lib/channelLookElements';
import type { ChannelPageItem } from '@tahti-web/lib/channelPageLayout';
import { useRightRailOverrideStore } from '@tahti-web/stores/rightRailOverrideStore';
import { useState, type ComponentProps } from 'react';
import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from 'storybook/test';

import {
  channelDesignMockData,
  DESIGN_SLUG,
  designLayout,
  restoreChannelDesignState,
} from './_fixtures/channel-design';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';
import { expectNoDialog, findDialog, selectTab, withinBody } from './_lib/play';

/**
 * Channel Designer broken out by look element so each panel can be corrected
 * in isolation. Prefer `livePreview: false` here to avoid dual WebGL with
 * other stories. Full interactive preview: use the **Full** stories.
 *
 * On desktop the full designer docks its controls into the app's right rail
 * (useDockedControlsRail), so the Full stories render the real
 * RightRailPanel next to it; below the `md` breakpoint the controls render
 * beside the preview instead.
 *
 * Data: the saved look and two saved presets come from
 * `_fixtures/channel-design.ts` through `parameters.mockData`.
 *
 * Correction tracker: `docs/todo/storybook-parity-and-atlas-refresh.md`.
 *
 * Missing states: empty/error visual load, slideshow with many frames,
 * video-loop upload progress, player tab with every visualizer preset.
 */
const meta: Meta<typeof ChannelDesigner> = {
  title: 'Tahti/Channel/Designer',
  component: ChannelDesigner,
  parameters: { layout: 'padded', mockData: channelDesignMockData() },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/settings/artist?tab=channel-designer'),
    withMockAuth(MOCK_USERS.artist),
  ],
  beforeEach: () => restoreChannelDesignState(),
  args: {
    displayName: 'Northern Lights',
    username: DESIGN_SLUG,
    channelSlug: DESIGN_SLUG,
    avatarUrl: 'https://picsum.photos/seed/tahti-northern-lights/256',
    bio: 'Ambient / downtempo, streaming most weeknights.',
    livePreview: false,
    presetLook: null,
    onSaved: fn(),
    onDirtyChange: fn(),
    onLookVisibilityChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

type DesignerProps = ComponentProps<typeof ChannelDesigner>;

/** The designer with the page layout ChannelView's editor would own, plus
 * the right rail its controls dock into on desktop. */
function DesignerWithRail(args: DesignerProps) {
  const [layout, setLayout] = useState<ChannelPageItem[]>(
    args.layout ?? designLayout(),
  );
  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <ChannelDesigner
          {...args}
          layout={layout}
          onLayoutChange={(updater) => {
            setLayout(updater);
            args.onLayoutChange?.(updater);
          }}
        />
      </div>
      <DockedRail />
    </div>
  );
}

/** A sibling of the designer, like the app shell's rail: subscribing in the
 * designer's parent would re-render the designer on every override write,
 * and the dock effect writes one on every render. */
function DockedRail() {
  const railOverride = useRightRailOverrideStore((s) => s.override);
  if (!railOverride) {
    return null;
  }
  return (
    <aside className="border-border h-[44rem] w-96 shrink-0 border-l">
      <RightRailPanel isCollapsed={false} />
    </aside>
  );
}

const fullArgs: Partial<DesignerProps> = {
  layout: designLayout(),
  onLayoutChange: fn(),
};

async function findPreview(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const preview = await canvas.findByRole(
    'main',
    { name: 'Channel page preview' },
    { timeout: 5000 },
  );
  return within(preview);
}

/** The ChannelElementEditor and its Look panels fade in on the next frame. */
const fadedIn = (element: HTMLElement) =>
  waitFor(() => expect(element).toBeVisible());

export const Full: Story = {
  name: 'Full (preview + controls)',
  args: { ...fullArgs, livePreview: true },
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement, args }) => {
    const preview = await findPreview(canvasElement);
    await expect(
      preview.getByTestId('channel-backdrop-top-bar'),
    ).toHaveTextContent('New album "Polar Drift" out Friday');
    await expect(
      within(canvasElement).getByRole('link', { name: 'Open my channel →' }),
    ).toBeVisible();
    await expect(args.onLookVisibilityChange).toHaveBeenCalled();
    await expect(args.onDirtyChange).toHaveBeenLastCalledWith(false);
  },
};

export const FullEverySection: Story = {
  name: 'Full: every section, tab and header style',
  args: fullArgs,
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = await findPreview(canvasElement);
    const section = canvas.getByRole('button', { name: 'Section' });
    await expect(section).toHaveTextContent('Background');

    for (let step = 0; step < CHANNEL_LOOK_ELEMENTS.length; step += 1) {
      const current = CHANNEL_LOOK_ELEMENTS.findIndex(
        (element) => section.textContent?.includes(element.label) ?? false,
      );
      const next =
        CHANNEL_LOOK_ELEMENTS[(current + 1) % CHANNEL_LOOK_ELEMENTS.length];
      await userEvent.click(
        canvas.getByRole('button', { name: 'Next section' }),
      );
      await expect(section).toHaveTextContent(next?.label ?? '');
    }

    await userEvent.click(section);
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', { name: 'Player' }),
    );
    await fadedIn(await canvas.findByTestId('channel-player-panel'));

    await selectTab(canvas, 'Video / image');
    await selectTab(canvas, 'Overlay');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Configure text' }),
    );
    const overlay = await findDialog(canvasElement, 'Configure text overlay');
    fireEvent.change(overlay.getByRole('slider', { name: /Opacity/ }), {
      target: { value: '0.6' },
    });
    await expect(
      overlay.getByRole('slider', { name: 'Opacity: 60%' }),
    ).toHaveValue('0.6');
    await userEvent.keyboard('{Escape}');
    await expectNoDialog(canvasElement);

    await selectTab(canvas, 'Gradient');
    await userEvent.click(
      canvas.getByRole('switch', {
        name: 'Use a separate gradient for the player',
      }),
    );
    await expect(
      canvas.getByLabelText('Accent / waveform played'),
    ).toBeVisible();

    await selectTab(canvas, 'Visualizer');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Configure AURORA' }),
    );
    await expect(canvas.getByRole('slider', { name: 'Speed' })).toHaveValue(
      '1.25',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Choose visualizer' }),
    );
    const picker = await findDialog(canvasElement, 'Choose visualizer');
    await userEvent.click(
      picker.getByRole('button', { name: /WAVEFORM BARS/ }),
    );
    await userEvent.click(
      picker.getByRole('button', { name: 'Use visualizer' }),
    );
    await expectNoDialog(canvasElement);
    await expect(
      canvas.getByTestId('channel-player-visualizer'),
    ).toHaveTextContent('WAVEFORM BARS');

    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit backdrop design' }),
    );
    await fadedIn(await canvas.findByTestId('channel-backdrop-panel'));
    const card = preview.getByTestId('channel-backdrop-card');
    for (const [tab, headerStyle, marker] of [
      ['SOLID', 'SOLID', 'Solid colors'],
      ['Video / image', 'VIDEO_LOOP', 'Accents'],
      ['Slideshow', 'GRADIENT', 'Slideshow'],
      ['Visualization', 'VISUALIZATION', 'Background visualizer'],
      ['GRADIENT', 'GRADIENT', 'Gradient colors'],
    ] as const) {
      await selectTab(
        within(canvas.getByRole('tablist', { name: 'Header style' })),
        tab,
      );
      await expect(card).toHaveAttribute('data-header-style', headerStyle);
      await expect(canvas.getAllByText(marker)[0]).toBeVisible();
    }
  },
};

export const FullEditLook: Story = {
  name: 'Full: edit colours, identity and top bar, then save',
  args: fullArgs,
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const preview = await findPreview(canvasElement);
    await fadedIn(await canvas.findByTestId('channel-backdrop-panel'));
    const save = canvas.getByRole('button', { name: 'Save layout' });
    await expect(save).toBeDisabled();

    fireEvent.change(canvas.getByLabelText('Accent'), {
      target: { value: '#f97316' },
    });
    await expect(preview.getByText('Artist channel')).toHaveStyle({
      backgroundColor: 'rgb(249, 115, 22)',
    });
    await expect(args.onDirtyChange).toHaveBeenLastCalledWith(true);
    await expect(save).toBeEnabled();

    await userEvent.click(canvas.getByRole('button', { name: 'Violet' }));
    await expect(
      canvas.getByRole('button', { name: 'Violet' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(preview.getByText('Artist channel')).toHaveStyle({
      backgroundColor: 'rgb(168, 85, 247)',
    });

    const topBar = canvas.getByLabelText('Top bar text');
    await userEvent.clear(topBar);
    await userEvent.type(topBar, 'Live tonight 21:00');
    await expect(
      preview.getByTestId('channel-backdrop-top-bar'),
    ).toHaveTextContent('Live tonight 21:00');

    await expect(
      preview.queryByTestId('channel-backdrop-subscribe-cta'),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole('switch', { name: 'Show Subscribe button' }),
    );
    await expect(
      preview.getByTestId('channel-backdrop-subscribe-cta'),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('switch', { name: 'Show bio' }));
    await expect(args.onLayoutChange).toHaveBeenCalledTimes(2);

    await userEvent.click(save);
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
    await waitFor(() => expect(save).toBeDisabled());
    await expect(args.onDirtyChange).toHaveBeenLastCalledWith(false);
  },
};

export const FullSavedLooks: Story = {
  name: 'Full: save, apply and delete presets, then reset',
  args: fullArgs,
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    const preview = await findPreview(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Ember dusk' }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    await userEvent.click(
      await body.findByRole('button', { name: 'Save preset' }),
    );
    const saveDialog = await findDialog(canvasElement, 'Save preset');
    await userEvent.type(
      saveDialog.getByLabelText('Preset name'),
      'Neon night',
    );
    await userEvent.click(
      saveDialog.getByRole('button', { name: 'Save preset' }),
    );
    await expectNoDialog(canvasElement);
    await expect(
      await canvas.findByRole('button', { name: 'Neon night' }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Ember dusk' }));
    await expect(await canvas.findByText(/Keep this look/)).toBeVisible();
    await expect(preview.getByText('Artist channel')).toHaveStyle({
      backgroundColor: 'rgb(249, 115, 22)',
    });
    await expect(preview.getByTestId('channel-backdrop-card')).toHaveAttribute(
      'data-header-style',
      'SOLID',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Keep' }));
    await expect(canvas.queryByText(/Keep this look/)).toBeNull();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Delete "Violet hour"' }),
    );
    const deleteDialog = await findDialog(
      canvasElement,
      /Delete .Violet hour.\?/,
    );
    await userEvent.click(
      deleteDialog.getByRole('button', { name: 'Delete preset' }),
    );
    await expectNoDialog(canvasElement);
    await waitFor(() =>
      expect(canvas.queryByRole('button', { name: 'Violet hour' })).toBeNull(),
    );

    await userEvent.click(canvas.getByRole('button', { name: 'More options' }));
    await userEvent.click(await body.findByRole('button', { name: 'Reset' }));
    const resetDialog = await findDialog(
      canvasElement,
      'Reset unsaved changes?',
    );
    await userEvent.click(resetDialog.getByRole('button', { name: 'Reset' }));
    await expectNoDialog(canvasElement);
    await waitFor(() =>
      expect(preview.getByTestId('channel-backdrop-top-bar')).toHaveTextContent(
        'New album "Polar Drift" out Friday',
      ),
    );
    await expect(
      canvas.getByRole('button', { name: 'Save layout' }),
    ).toBeDisabled();
  },
};

export const FullRevertAppliedPreset: Story = {
  name: 'Full: apply a saved look, then revert',
  args: fullArgs,
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = await findPreview(canvasElement);
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Violet hour' }),
    );
    await expect(preview.getByText('Artist channel')).toHaveStyle({
      backgroundColor: 'rgb(168, 85, 247)',
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Revert' }));
    await waitFor(() =>
      expect(preview.getByText('Artist channel')).toHaveStyle({
        backgroundColor: 'rgb(34, 211, 238)',
      }),
    );
    await expect(canvas.queryByText(/Keep this look/)).toBeNull();
  },
};

export const LayoutPresetLook: Story = {
  name: 'Full: layout preset look applied as a draft',
  args: {
    ...fullArgs,
    presetLook: {
      token: 1,
      look: {
        visualPreset: 'PARTICLE_FIELD',
        headerStyle: 'SOLID',
        brandAccentPreset: 'ember',
        colorScheme: {
          accent: '#F97316',
          highlight: '#FBBF24',
          bg: '#120B08',
          text: '#FFF7ED',
        },
      },
    },
  },
  render: (args) => <DesignerWithRail {...args} />,
  play: async ({ canvasElement, args }) => {
    const preview = await findPreview(canvasElement);
    await waitFor(() =>
      expect(preview.getByTestId('channel-backdrop-card')).toHaveAttribute(
        'data-header-style',
        'SOLID',
      ),
    );
    await expect(preview.getByText('Artist channel')).toHaveStyle({
      backgroundColor: 'rgb(249, 115, 22)',
    });
    await expect(args.onDirtyChange).toHaveBeenLastCalledWith(true);
  },
};

export const Compact: Story = {
  name: 'Compact (profile tab)',
  args: { compact: true },
};

export const LookOnlyShell: Story = {
  name: 'Look-only shell (layers dock)',
  args: { lookOnly: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fadedIn(await canvas.findByTestId('channel-backdrop-panel'));
    await expect(
      canvas.queryByRole('main', { name: 'Channel page preview' }),
    ).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Section' }));
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', { name: 'Player' }),
    );
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Hide Player' }),
    );
    await expect(args.onLookVisibilityChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ player: false }),
    );
    await expect(
      canvas.getByRole('button', { name: 'Show Player' }),
    ).toHaveAttribute('aria-pressed', 'false');
  },
};

/** One story per CHANNEL_LOOK_ELEMENTS id: select that panel in look-only mode. */
function lookElementStory(id: ChannelLookElementId): Story {
  const metaRow = CHANNEL_LOOK_ELEMENTS.find((element) => element.id === id);
  return {
    name: metaRow ? `${metaRow.label} (${id})` : id,
    args: { lookOnly: true, lookOpenSection: id },
    play: async ({ canvasElement }) => {
      await expect(
        await within(canvasElement).findByRole('button', { name: 'Section' }),
      ).toHaveTextContent(metaRow?.label ?? id);
    },
  };
}

export const Backdrop = lookElementStory('backdrop');
export const Player = lookElementStory('player');
export const Releases = lookElementStory('releases');
export const Tracks = lookElementStory('tracks');
export const Latest = lookElementStory('latest');
export const Feed = lookElementStory('feed');
export const News = lookElementStory('news');
export const Bio = lookElementStory('bio');
export const Shows = lookElementStory('shows');
export const Gallery = lookElementStory('gallery');

export const PlayerDesignAlias: Story = {
  name: 'Player (legacy player-design section id)',
  args: { lookOnly: true, lookOpenSection: 'player-design' },
};

export const TextOverlayAlias: Story = {
  name: 'Player (legacy text-overlay section id)',
  args: { lookOnly: true, lookOpenSection: 'text-overlay' },
};
