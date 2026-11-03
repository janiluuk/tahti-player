import type { Meta, StoryObj } from '@storybook/react-vite';
import { HistoryBackButton } from '@tahti-web/components/HistoryBackButton';
import { LegalHubLinks } from '@tahti-web/components/LegalHubLinks';
import { PageBackLink } from '@tahti-web/components/PageBackLink';
import { PostLink } from '@tahti-web/components/PostLink';
import { SkipToContent } from '@tahti-web/components/SkipToContent';
import { SocialLinkIcon } from '@tahti-web/components/SocialLinkIcon';
import { expect, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Components/Navigation pieces',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Back links and buttons, the skip link, legal links, a post link and social link icons.',
      },
    },
  },
  decorators: [withTahtiRouter('/help')],
};

export default meta;
type Story = StoryObj;

export const BackLink: Story = {
  render: () => <PageBackLink to="/studio" label="Back to Studio" />,
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('link', { name: /Back to Studio/ }),
    ).toHaveAttribute('href', '/studio');
  },
};

export const HistoryBack: Story = {
  render: () => <HistoryBackButton fallback="/" />,
};

export const SkipLink: Story = {
  render: () => <SkipToContent />,
};

export const Legal: Story = {
  render: () => <LegalHubLinks />,
};

export const Post: Story = {
  render: () => (
    <PostLink
      linkUrl="https://tahti.live/news/open"
      linkLabel="Read the announcement"
    />
  ),
};

export const SocialIcons: Story = {
  render: () => (
    <div className="flex gap-2">
      <SocialLinkIcon label="Instagram" url="https://instagram.com/tahti" />
      <SocialLinkIcon label="Bandcamp" url="https://tahti.bandcamp.com" />
      <SocialLinkIcon label="Website" url="https://tahti.live" />
    </div>
  ),
};
