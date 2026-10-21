import type { Meta, StoryObj } from '@storybook/react-vite';
import { DownloadIcon } from 'lucide-react';

import { ButtonAnchor, ButtonLink } from '@tahti-player/ui';

import { withTahtiRouter } from './tahti-web/_lib/decorators';

const meta: Meta<typeof ButtonLink> = {
  title: 'Components/ButtonLink',
  component: ButtonLink,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const Default: Story = {
  render: () => (
    <div className="flex gap-3">
      <ButtonLink to="/" size="sm">
        New release
      </ButtonLink>
      <ButtonLink to="/" size="sm" variant="secondary">
        View all
      </ButtonLink>
      <ButtonLink to="/" size="sm" variant="secondary" disabled>
        Disabled
      </ButtonLink>
    </div>
  ),
};

export const Anchor: Story = {
  render: () => (
    <div className="flex gap-3">
      <ButtonAnchor href="#" download size="sm" variant="secondary">
        <DownloadIcon size={16} aria-hidden className="mr-1.5" />
        Download WAV
      </ButtonAnchor>
      <ButtonAnchor href="#" size="sm" disabled>
        Unavailable
      </ButtonAnchor>
    </div>
  ),
};
