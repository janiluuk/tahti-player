import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatAvatar } from '@tahti-web/components/ChatAvatar';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ChatAvatar> = {
  title: 'Tahti/Channel/ChatAvatar',
  component: ChatAvatar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { handle: 'northern-lights' },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('N')).toBeInTheDocument();
  },
};

const HANDLES = [
  'northern-lights',
  'aurora-fan',
  'kaamos-mod',
  'lumi',
  'nightbus',
  ' ',
];

export const ColourPerHandle: Story = {
  name: 'One colour per handle',
  render: () => (
    <div className="flex gap-2">
      {HANDLES.map((handle) => (
        <ChatAvatar key={handle} handle={handle} />
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('A')).toBeInTheDocument();
    await expect(canvas.getByText('?')).toBeInTheDocument();
  },
};
