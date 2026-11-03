import type { Meta, StoryObj } from '@storybook/react-vite';
import type { TahtiPlayable } from '@tahti-web/api/types';
import {
  ChannelPageSections,
  type ChannelPageTab,
} from '@tahti-web/components/channel-view/ChannelPageTabs';
import { ChannelEmbedsSection } from '@tahti-web/components/channel-view/ChannelViewBlocks';
import { useState, type ComponentProps } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import {
  CHANNEL_NAME,
  CHANNEL_SLUG,
  PINNED_PLAYABLES,
} from './_fixtures/channel';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const EMBEDS: TahtiPlayable[] = [
  {
    id: 'nl-embed-1',
    kind: 'sound',
    title: 'Nightriders vol. 46 (hearthis.at)',
    artist: CHANNEL_NAME,
    streamUrl: '',
    protocol: 'https',
    channelSlug: CHANNEL_SLUG,
    sourceProvider: 'hearthis',
    embed: { provider: 'hearthis', embedUri: 'northern-lights/nightriders-46' },
  },
];

type Props = ComponentProps<typeof ChannelPageSections>;

/** Keeps the selected tab the way ChannelView does. */
function Sections(props: Props) {
  const [tab, setTab] = useState<ChannelPageTab>(props.tab);
  return <ChannelPageSections {...props} tab={tab} onTabChange={setTab} />;
}

const meta: Meta<typeof ChannelPageSections> = {
  title: 'Tahti/Channel/ChannelPageTabs',
  component: ChannelPageSections,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The channel page's tabs under the stage: Music, Embeds (tracks hosted on hearthis.at, SoundCloud and other sites, only when the channel has some), Comments and Chat (only while chat is on).",
      },
    },
  },
  args: {
    tab: 'music',
    onTabChange: () => undefined,
    editing: false,
    chatOn: true,
    slug: CHANNEL_SLUG,
    isOwner: false,
    music: <p data-testid="story-music">The channel's music blocks</p>,
    embeds: null,
  },
  render: (args) => (
    <div className="flex max-w-3xl flex-col gap-3">
      <Sections {...args} />
    </div>
  ),
  decorators: [
    withTahtiRouter(`/channel/${CHANNEL_SLUG}`),
    withMockAuth(MOCK_USERS.listener),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithoutEmbeds: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole('tab').map((tab) => tab.textContent),
    ).toEqual(['Music', 'Comments', 'Chat']);
    await expect(canvas.getByTestId('story-music')).toBeVisible();
  },
};

export const WithEmbeds: Story = {
  args: {
    embeds: (
      <ChannelEmbedsSection
        embeds={EMBEDS}
        pinnedPlayables={PINNED_PLAYABLES}
        getTrackMeta={() => undefined}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole('tab').map((tab) => tab.textContent),
    ).toEqual(['Music', 'Embeds', 'Comments', 'Chat']);
    await expect(canvas.queryByTestId('channel-embeds')).toBeNull();

    await userEvent.click(canvas.getByRole('tab', { name: 'Embeds' }));
    const embeds = await canvas.findByTestId('channel-embeds');
    await expect(
      within(embeds).getByRole('heading', { name: 'Embeds' }),
    ).toBeVisible();
    await expect(
      within(embeds).getByText('Nightriders vol. 46 (hearthis.at)'),
    ).toBeVisible();
    await expect(canvas.queryByTestId('story-music')).toBeNull();
  },
};

export const ChatOff: Story = {
  args: { chatOn: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getAllByRole('tab').map((tab) => tab.textContent),
    ).toEqual(['Music', 'Comments']);
  },
};
