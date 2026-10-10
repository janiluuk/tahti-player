import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { FavoriteButton } from '@tahti-player/ui';

const ADD_LABEL = 'Add to favorites';
const REMOVE_LABEL = 'Remove from favorites';

const meta: Meta<typeof FavoriteButton> = {
  title: 'Components/FavoriteButton',
  component: FavoriteButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { ariaLabelAdd: ADD_LABEL, ariaLabelRemove: REMOVE_LABEL },
  argTypes: {
    isFavorite: {
      control: { type: 'boolean' },
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm'],
    },
  },
};

export default meta;
type Story = StoryObj<Meta<typeof FavoriteButton>>;

export const Default: Story = {
  args: {
    isFavorite: false,
    onToggle: () => {},
  },
};

export const Favorited: Story = {
  args: {
    isFavorite: true,
    onToggle: () => {},
  },
};

export const SmallSize: Story = {
  args: {
    isFavorite: false,
    size: 'sm',
    onToggle: () => {},
  },
};

export const SmallFavorited: Story = {
  args: {
    isFavorite: true,
    size: 'sm',
    onToggle: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4">
        <FavoriteButton
          isFavorite={isFavorite}
          onToggle={() => setIsFavorite(!isFavorite)}
          ariaLabelAdd={ADD_LABEL}
          ariaLabelRemove={REMOVE_LABEL}
        />
        <p className="text-foreground text-sm">
          {isFavorite ? 'Favorited!' : 'Not favorited'}
        </p>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: ADD_LABEL }));
    await expect(canvas.getByText('Favorited!')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: REMOVE_LABEL }));
    await expect(canvas.getByText('Not favorited')).toBeVisible();
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <FavoriteButton
          isFavorite={false}
          onToggle={() => {}}
          ariaLabelAdd={ADD_LABEL}
          ariaLabelRemove={REMOVE_LABEL}
        />
        <span className="text-foreground text-xs">Default</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <FavoriteButton
          isFavorite={true}
          onToggle={() => {}}
          ariaLabelAdd={ADD_LABEL}
          ariaLabelRemove={REMOVE_LABEL}
        />
        <span className="text-foreground text-xs">Favorited</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <FavoriteButton
          isFavorite={false}
          size="sm"
          onToggle={() => {}}
          ariaLabelAdd={ADD_LABEL}
          ariaLabelRemove={REMOVE_LABEL}
        />
        <span className="text-foreground text-xs">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <FavoriteButton
          isFavorite={true}
          size="sm"
          onToggle={() => {}}
          ariaLabelAdd={ADD_LABEL}
          ariaLabelRemove={REMOVE_LABEL}
        />
        <span className="text-foreground text-xs">Small Favorited</span>
      </div>
    </div>
  ),
};
