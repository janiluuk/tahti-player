import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArtistCredits } from '@tahti-web/components/artist-view/ArtistCredits';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ArtistCredits> = {
  title: 'Tahti/Artist/ArtistCredits',
  component: ArtistCredits,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Band / project members (name + role) the artist listed in Studio, shown on the Stage tab for group channels.',
      },
    },
  },
  args: { channelSlug: 'northern-lights' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole('region', { name: 'Credits' });
    await expect(within(section).getByText('Vocals, synths')).toBeVisible();
    await expect(within(section).getByText('Drums')).toBeVisible();
  },
};
