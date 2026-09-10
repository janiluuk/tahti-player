import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimelineReactionBar } from '@tahti-web/components/TimelineReactionBar';
import { useState } from 'react';

const meta: Meta<typeof TimelineReactionBar> = {
  title: 'Tahti/Track/TimelineReactionBar',
  component: TimelineReactionBar,
  parameters: { layout: 'centered', backgrounds: { default: 'dark' } },
  tags: ['autodocs'],
  args: {
    clock: '02:18',
    commentsEnabled: true,
    signedIn: true,
    busy: false,
    commentOpen: false,
    onReact: () => {},
    onComment: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};
export const SignedOut: Story = { args: { signedIn: false } };
export const CommentsDisabled: Story = {
  args: { commentsEnabled: false },
  parameters: {
    docs: {
      description: {
        story:
          'When comments are disabled, the comment icon is not rendered at all — only the (disabled) reaction emoji stay visible.',
      },
    },
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [commentOpen, setCommentOpen] = useState(false);
    const [lastReaction, setLastReaction] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-3">
        <TimelineReactionBar
          {...args}
          commentOpen={commentOpen}
          onReact={setLastReaction}
          onComment={() => setCommentOpen((open) => !open)}
        />
        <p className="text-sm text-white/75">
          {lastReaction
            ? `Reaction ${lastReaction} added at ${args.clock}.`
            : commentOpen
              ? `Comment composer opened at ${args.clock}.`
              : 'Choose a reaction or open the comment composer.'}
        </p>
      </div>
    );
  },
};
