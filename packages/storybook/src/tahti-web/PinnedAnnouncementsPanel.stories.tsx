import type { Meta, StoryObj } from '@storybook/react-vite';
import { PinnedAnnouncementsPanel } from '@tahti-web/components/PinnedAnnouncementsPanel';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';

/**
 * Studio → Channel → Radio → Pinned: up to three short announcements
 * shown above chat on the artist's channel. Fetches/posts through
 * `api/announcements`, falling back to dev fixtures when the API isn't
 * reachable.
 */
const meta: Meta<typeof PinnedAnnouncementsPanel> = {
  title: 'Tahti/Studio/PinnedAnnouncementsPanel',
  component: PinnedAnnouncementsPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/studio/channel'), withMockAuth()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { slug: 'northern-lights' },
};
