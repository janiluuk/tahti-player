import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Button, Textarea } from '@tahti-player/ui';

const meta: Meta<typeof Textarea> = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: 'Add a description...',
  },
};

export const Secondary: Story = {
  args: {
    tone: 'secondary',
    placeholder: 'Notes...',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue:
      'A curated collection of tracks for late night coding sessions.',
  },
};

/** Label, description and error, wired like `Input`'s. */
export const WithLabel: Story = {
  args: {
    label: 'Message',
    description: 'Up to 5000 characters.',
    placeholder: 'How can we help?',
  },
};

export const WithError: Story = {
  args: {
    label: 'What is being corrected',
    error: 'Describe the correction.',
  },
};

const submitComment = fn();

/** `submitOnModEnter`: Cmd/Ctrl+Enter submits the enclosing form; Enter
 * alone still adds a new line. */
export const SubmitOnModEnter: Story = {
  render: () => (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submitComment();
      }}
    >
      <Textarea label="Comment" submitOnModEnter rows={3} />
      <Button type="submit" className="self-end">
        Post comment
      </Button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Comment' });
    await userEvent.type(field, 'First line{Enter}second line');
    await expect(submitComment).not.toHaveBeenCalled();
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await expect(submitComment).toHaveBeenCalledTimes(1);
  },
};
