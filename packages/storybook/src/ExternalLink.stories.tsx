import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExternalLink } from '@tahti-player/ui';

const meta: Meta<typeof ExternalLink> = {
  title: 'Components/ExternalLink',
  component: ExternalLink,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ExternalLink>;

export const Default: Story = {
  args: { href: 'https://musicbrainz.org', children: 'MusicBrainz' },
};

export const WithIcon: Story = {
  args: {
    href: 'https://musicbrainz.org',
    children: 'Add on MusicBrainz',
    showIcon: true,
  },
};
