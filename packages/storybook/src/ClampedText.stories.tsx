import type { Meta, StoryObj } from '@storybook/react-vite';

import { ClampedText } from '@tahti-player/ui';

const meta: Meta<typeof ClampedText> = {
  title: 'Components/ClampedText',
  component: ClampedText,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Meta<typeof ClampedText>>;

const longBio =
  'Helsinki-based producer making slow, warm electronic music out of field recordings, tape loops and an old Juno.\n\nStarted on the Kallio pirate radio scene in 2009, played the first Flow Festival night stage, and has been running the Lumi tapes label since 2015. New album out in spring.';

export const LongText: Story = {
  args: {
    lines: 2,
    className: 'whitespace-pre-wrap',
    children: longBio,
    wrapperClassName: 'max-w-md',
  },
};

export const ShortText: Story = {
  args: {
    lines: 2,
    children: 'Producer from Helsinki.',
    wrapperClassName: 'max-w-md',
  },
};

export const OnColouredHeader: Story = {
  render: () => (
    <div className="bg-primary text-primary-foreground max-w-md rounded-lg p-4">
      <ClampedText className="text-sm whitespace-pre-wrap">
        {longBio}
      </ClampedText>
    </div>
  ),
};
