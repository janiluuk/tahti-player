import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { InlineError } from '@tahti-player/ui';

const meta: Meta<typeof InlineError> = {
  title: 'Components/InlineError',
  component: InlineError,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof InlineError>;

export const Default: Story = {
  args: { children: 'Could not save your changes. Try again.' },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      'Could not save your changes. Try again.',
    );
  },
};

/** `textSize="xs"` for dense rows and dialog footers. */
export const Small: Story = {
  args: { textSize: 'xs', children: 'This file is larger than 2 MB.' },
};

/** `announce={false}` for a standing notice that is not a response to the
 * user's last action. */
export const StandingNotice: Story = {
  args: {
    announce: false,
    children: 'Verify your email before completing membership checkout.',
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole('alert')).toBeNull();
  },
};
