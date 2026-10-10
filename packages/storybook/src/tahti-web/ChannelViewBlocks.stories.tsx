import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  renderChannelBlock,
  type ChannelBlockRenderContext,
} from '@tahti-web/components/channel-view';
import type { ChannelPageItem } from '@tahti-web/lib/channelPageLayout';
import { expect, fn, userEvent, within } from 'storybook/test';

import { blockContext, CHANNEL_SLUG } from './_fixtures/channel';
import { withTahtiRouter } from './_lib/decorators';

type BlockProps = {
  item: ChannelPageItem;
  ctx: ChannelBlockRenderContext;
};

function ChannelBlock({ item, ctx }: BlockProps) {
  return <div className="max-w-3xl">{renderChannelBlock(item, ctx)}</div>;
}

const meta: Meta<typeof ChannelBlock> = {
  title: 'Tahti/Channel/ChannelViewBlocks',
  component: ChannelBlock,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The channel page's small blocks as `renderChannelBlock` draws them: tracks, chat pointer, navigation, links, programming, stats, live shows and feed. The hero is `ChannelHeroBlock`; about, subscribe and avatar fold into the backdrop.",
      },
    },
  },
  decorators: [withTahtiRouter(`/channel/${CHANNEL_SLUG}`)],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Tracks: Story = {
  args: {
    item: { id: 'sound-1', type: 'sound', visible: true },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Tracks' })).toBeVisible();
    await expect(canvas.getByText('Pinned')).toBeVisible();
    await expect(canvas.getByText('Catalog')).toBeVisible();
    await expect(canvas.getByText('Polar Static')).toBeVisible();
    await expect(canvas.getByText('Snowline')).toBeVisible();
  },
};

export const TracksFailed: Story = {
  args: {
    item: { id: 'sound-1', type: 'sound', visible: true },
    ctx: blockContext({
      sectionStatus: { sounds: 'error', widgets: 'ready', shows: 'ready' },
      onRetrySection: fn(),
    }),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Tracks couldn't load")).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: /retry|try again/i }),
    );
    await expect(args.ctx.onRetrySection).toHaveBeenCalledWith('sounds');
  },
};

export const ChatPointer: Story = {
  args: {
    item: { id: 'chat-1', type: 'chat', visible: true },
    ctx: blockContext({ onOpenChat: fn() }),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/right sidebar Chat tab/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Open chat in sidebar' }),
    );
    await expect(args.ctx.onOpenChat).toHaveBeenCalledOnce();
  },
};

export const ChatOff: Story = {
  args: {
    item: { id: 'chat-1', type: 'chat', visible: true },
    ctx: blockContext({ chatOn: false }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText('Chat is disabled for this channel.'),
    ).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const Navigation: Story = {
  args: {
    item: {
      id: 'nav-1',
      type: 'navigation',
      visible: true,
      navigationTabs: [
        { id: 'tab-music', label: 'Music', itemIds: [] },
        { id: 'tab-shows', label: 'Shows', itemIds: [] },
      ],
    },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('2 tabs shown under the player.'),
    ).toBeVisible();
  },
};

export const Links: Story = {
  args: {
    item: { id: 'links-1', type: 'links', visible: true },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bandcamp = canvas.getByRole('link', { name: /Bandcamp/ });
    await expect(bandcamp).toHaveAttribute(
      'href',
      'https://northernlights.bandcamp.com',
    );
    await expect(bandcamp).toHaveAttribute('target', '_blank');
    await expect(canvas.getByRole('link', { name: /Instagram/ })).toBeVisible();
    await expect(canvas.queryByRole('link', { name: /Old blog/ })).toBeNull();
  },
};

export const LinksWhileEditing: Story = {
  args: {
    item: { id: 'links-1', type: 'links', visible: true },
    ctx: blockContext({ editing: true, channelLinksDraft: [] }),
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText(
        'Add links in the side panel to show them here.',
      ),
    ).toBeVisible();
  },
};

export const Programming: Story = {
  args: {
    item: { id: 'prog-1', type: 'programming', visible: true },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByText(/^Next up · .* — Night Drive Sessions$/),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'View full schedule →' }),
    ).toHaveAttribute('href', '/schedule');
    await expect(canvas.queryByTestId('radio-programming-grid')).toBeNull();
  },
};

export const ProgrammingNothingScheduled: Story = {
  args: {
    item: { id: 'prog-1', type: 'programming', visible: true },
    ctx: blockContext({
      channel: {
        ...blockContext().channel,
        nextBroadcastAt: null,
        nextBroadcastNote: null,
      },
    }),
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByText('No broadcast currently scheduled.'),
    ).toBeVisible();
  },
};

export const Stats: Story = {
  args: {
    item: { id: 'stats-1', type: 'stats', visible: true },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Followers')).toBeVisible();
    await expect(canvas.getByText(/1,?284/)).toBeVisible();
  },
};

export const LiveShows: Story = {
  args: {
    item: { id: 'events-1', type: 'events', visible: true },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Live shows' }),
    ).toBeVisible();
    await expect(canvas.getByText('Upcoming')).toBeVisible();
    await expect(canvas.getByText('Past recordings')).toBeVisible();
    await expect(
      canvas.getAllByText(/Night Drive Sessions #1[23]/),
    ).toHaveLength(2);
  },
};

export const LiveShowsFailed: Story = {
  args: {
    item: { id: 'events-1', type: 'events', visible: true },
    ctx: blockContext({
      sectionStatus: { sounds: 'ready', widgets: 'ready', shows: 'error' },
      onRetrySection: fn(),
    }),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Shows couldn't load")).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: /retry|try again/i }),
    );
    await expect(args.ctx.onRetrySection).toHaveBeenCalledWith('shows');
  },
};

export const NoShowsPublic: Story = {
  args: {
    item: { id: 'events-1', type: 'events', visible: true },
    ctx: blockContext({ liveShows: null }),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent?.trim()).toBe('');
  },
};

export const Feed: Story = {
  args: {
    item: {
      id: 'feed-1',
      type: 'feed',
      visible: true,
      feedDisplay: 'cards',
    },
    ctx: blockContext(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Feed' })).toBeVisible();
    await expect(
      canvas.getByText(/Northern Lights's updates/),
    ).toHaveTextContent('(cards display)');
    await expect(
      canvas.getByText(/No live update source is wired in yet/),
    ).toBeVisible();
  },
};
