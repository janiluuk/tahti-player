import type { Meta, StoryObj } from '@storybook/react-vite';
import { RandomTrackGenres } from '@tahti-web/components/discover/RandomTrackGenres';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

const meta = {
  title: 'Tahti/Discover/RandomTrackGenres',
  component: RandomTrackGenres,
  parameters: {
    docs: {
      description: {
        component:
          'Random track widget toolbar: the remembered genre selection as pills, a genre dialog where All genres clears the rest, and a re-roll.',
      },
    },
  },
  args: { genres: [], onChange: fn(), onShuffle: fn() },
  render: function Render(args) {
    const [genres, setGenres] = useState(args.genres);
    return (
      <div className="max-w-sm">
        <RandomTrackGenres {...args} genres={genres} onChange={setGenres} />
      </div>
    );
  },
} satisfies Meta<typeof RandomTrackGenres>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllGenres: Story = {};

export const PickGenres: Story = {
  args: { genres: ['House'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Choose genres' }),
    );
    const body = within(document.body);
    await userEvent.click(body.getByRole('checkbox', { name: 'All genres' }));
    await userEvent.click(body.getByRole('button', { name: 'Done' }));
    await expect(canvas.getByText('All genres')).toBeVisible();
  },
};
