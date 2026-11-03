import type { Meta, StoryObj } from '@storybook/react-vite';
import { Nameplate } from '@tahti-web/components/Nameplate';
import { RssFeedButton } from '@tahti-web/components/RssFeedButton';
import { StarRating } from '@tahti-web/components/StarRating';
import { TahtiMemberBadge } from '@tahti-web/components/TahtiMemberBadge';
import { expect, within } from 'storybook/test';

const meta: Meta = {
  title: 'Tahti/Components/Small indicators',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Star ratings, the Tahti member badge, an artist nameplate and the RSS feed button.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Stars: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StarRating stars={0} />
      <StarRating stars={3} />
      <StarRating stars={5} />
    </div>
  ),
};

export const MemberBadge: Story = {
  render: () => (
    <div className="flex gap-3">
      <TahtiMemberBadge isMember />
      <TahtiMemberBadge isMember={false} />
    </div>
  ),
};

export const NameplateStory: Story = {
  name: 'Nameplate',
  render: () => (
    <div className="flex flex-col gap-3">
      <Nameplate text="Northern Lights" color="#22D3EE" />
      <Nameplate text="No colour set" fallbackColor="#A78BFA" />
    </div>
  ),
};

export const RssFeed: Story = {
  render: () => (
    <RssFeedButton
      href="/api/v1/channels/northern-lights/rss.xml"
      label="RSS feed of Northern Lights"
    />
  ),
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('button', {
        name: 'Copy the RSS feed of Northern Lights',
      }),
    ).toBeVisible();
  },
};
