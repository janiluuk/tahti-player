import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ChannelHeroBlock,
  type ChannelHeroBlockProps,
} from '@tahti-web/components/channel-view';
import type { ChannelPageItem } from '@tahti-web/lib/channelPageLayout';
import { normalizeColorScheme } from '@tahti-web/lib/colorScheme';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { CHANNEL_NAME, CHANNEL_SLUG, storyChannel } from './_fixtures/channel';
import { withMockAuth, withTahtiRouter } from './_lib/decorators';

const channel = storyChannel({ headerStyle: 'GRADIENT' });
const scheme = normalizeColorScheme(channel.colorScheme);

const BASE_LAYOUT: ChannelPageItem[] = [
  { id: 'hero-1', type: 'hero', visible: true },
  { id: 'sound-1', type: 'sound', visible: true },
];

/** Keeps `layout` in state so quick-add chips behave as on the page. */
function HeroWithLayout(props: ChannelHeroBlockProps) {
  const [layout, setLayout] = useState(props.layout);
  return (
    <ChannelHeroBlock
      {...props}
      layout={layout}
      updateLayout={(updater) => {
        props.updateLayout(updater);
        setLayout((prev) =>
          typeof updater === 'function' ? updater(prev) : updater,
        );
      }}
    />
  );
}

const meta: Meta<typeof ChannelHeroBlock> = {
  title: 'Tahti/Channel/ChannelHeroBlock',
  component: ChannelHeroBlock,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The channel page's hero block: the designed backdrop (name, avatar, bio, subscribe), the player stage, and the optional navigation bar. While editing, chips add the Links, Bio and Stats blocks that are missing.",
      },
    },
  },
  args: {
    itemId: 'hero-1',
    channel,
    slug: CHANNEL_SLUG,
    editing: false,
    subtle: false,
    selectedId: null,
    onSelectHeader: fn(),
    channelVideoMuted: true,
    headerAccent: scheme.accent,
    headerHighlight: scheme.highlight,
    headerBackground: scheme.bg,
    headerForeground: scheme.text,
    playerScheme: scheme,
    showNavTabs: false,
    navTabs: [],
    activeNavTab: null,
    onSelectNavTab: fn(),
    layout: BASE_LAYOUT,
    updateLayout: fn(),
    avatarVisible: true,
    bioVisible: true,
    subscribeVisible: true,
    stagePlayer: (
      <div className="p-6 text-sm text-white" data-testid="story-stage">
        Player stage
      </div>
    ),
  },
  render: (args) => (
    <div className="max-w-4xl">
      <HeroWithLayout {...args} />
    </div>
  ),
  decorators: [withMockAuth(null), withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PublicPage: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { level: 1, name: CHANNEL_NAME }),
    ).toBeVisible();
    await expect(
      canvas.getByTestId('channel-backdrop-subscribe-cta'),
    ).toBeVisible();
    await expect(
      within(canvas.getByTestId('channel-stage-player')).getByTestId(
        'story-stage',
      ),
    ).toBeVisible();
    await expect(canvas.queryByTestId('channel-stage-nav')).toBeNull();
  },
};

export const NavigationTabs: Story = {
  args: {
    showNavTabs: true,
    navTabs: [
      { id: 'tab-music', label: 'Music', itemIds: ['sound-1'] },
      { id: 'tab-shows', label: 'Shows', itemIds: [] },
    ],
    activeNavTab: { id: 'tab-music', label: 'Music', itemIds: ['sound-1'] },
  },
  play: async ({ canvasElement, args }) => {
    const nav = within(
      await within(canvasElement).findByTestId('channel-stage-nav'),
    );
    await expect(nav.queryByRole('button', { name: 'Music' })).toBeNull();
    await expect(nav.getByText('Music')).toHaveClass('border-primary');
    await userEvent.click(nav.getByRole('button', { name: 'Shows' }));
    await expect(args.onSelectNavTab).toHaveBeenCalledWith('tab-shows');
  },
};

export const EditingQuickAdd: Story = {
  args: {
    editing: true,
    subscribeVisible: false,
    layout: [...BASE_LAYOUT, { id: 'stats-1', type: 'stats', visible: true }],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const nav = within(await canvas.findByTestId('channel-stage-nav'));
    await expect(nav.getByRole('button', { name: '+ Bio' })).toBeVisible();
    await expect(nav.queryByRole('button', { name: '+ Stats' })).toBeNull();
    await expect(
      canvas.queryByTestId('channel-backdrop-subscribe-cta'),
    ).toBeNull();
    await userEvent.click(nav.getByRole('button', { name: '+ Links' }));
    await expect(args.updateLayout).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(nav.queryByRole('button', { name: '+ Links' })).toBeNull(),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Edit backdrop design' }),
    );
    await expect(args.onSelectHeader).toHaveBeenCalled();
  },
};
