import type { Meta, StoryObj } from '@storybook/react-vite';
import { MaterialGenreField } from '@tahti-web/components/MaterialGenreField';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof MaterialGenreField> = {
  title: 'Tahti/Track/MaterialGenreField',
  component: MaterialGenreField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Genre card for material edit — main genre select plus sub-genre chips.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    genre: 'Trance',
    subGenres: ['Progressive Trance'],
    subGenreSuggestions: ['Progressive House', 'Uplifting', 'Psytrance'],
    onGenreChange: fn(),
    onSubGenresChange: fn(),
  },
  render: function Render(args) {
    const [genre, setGenre] = useState(args.genre);
    const [subGenres, setSubGenres] = useState(args.subGenres);
    return (
      <div className="max-w-xl">
        <MaterialGenreField
          {...args}
          genre={genre}
          onGenreChange={(next) => {
            args.onGenreChange(next);
            setGenre(next);
          }}
          subGenres={subGenres}
          onSubGenresChange={(next) => {
            args.onSubGenresChange(next);
            setSubGenres(next);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Empty: Story = {
  args: { genre: '', subGenres: [] },
};

export const AddSubGenre: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Progressive House' }),
    );
    await expect(args.onSubGenresChange).toHaveBeenLastCalledWith([
      'Progressive Trance',
      'Progressive House',
    ]);
  },
};

export const TypeSubGenre: Story = {
  args: { subGenres: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('combobox', { name: 'Add a sub-genre' }),
      'Ambient Techno',
    );
    await userEvent.click(
      await withinBody(canvasElement).findByRole('option', {
        name: 'Add "Ambient Techno"',
      }),
    );
    await expect(args.onSubGenresChange).toHaveBeenLastCalledWith([
      'Ambient Techno',
    ]);
  },
};
