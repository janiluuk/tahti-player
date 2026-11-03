import type { Meta, StoryObj } from '@storybook/react-vite';
import { HelpLinkCard } from '@tahti-web/components/HelpLinkCard';
import { ImageUrlForm } from '@tahti-web/components/ImageUrlForm';
import { BookOpenIcon } from 'lucide-react';
import { fn } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

const meta: Meta = {
  title: 'Tahti/Components/Small forms and cards',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The paste-an-image-URL form used by cover pickers, and the help centre link card.',
      },
    },
  },
  decorators: [withTahtiRouter('/help')],
};

export default meta;
type Story = StoryObj;

export const ImageUrl: Story = {
  render: () => (
    <div className="max-w-md">
      <ImageUrlForm busy={false} onSubmit={fn(async () => true)} />
    </div>
  ),
};

export const ImageUrlBusy: Story = {
  render: () => (
    <div className="max-w-md">
      <ImageUrlForm busy onSubmit={fn(async () => true)} />
    </div>
  ),
};

export const HelpLink: Story = {
  render: () => (
    <div className="max-w-sm">
      <HelpLinkCard
        title="Upload your first track"
        description="From a WAV or FLAC to a public track page in five steps."
        icon={<BookOpenIcon size={18} />}
      />
    </div>
  ),
};
