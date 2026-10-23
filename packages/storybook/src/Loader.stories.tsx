import { StoryObj } from '@storybook/react-vite';

import { InlineLoader, Loader } from '@tahti-player/ui';

const meta = { title: 'Components/Loader', component: Loader };

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const LG: Story = {
  args: { size: 'lg' },
};

export const XL: Story = {
  args: { size: 'xl' },
};

export const InlineCircle: Story = {
  args: { size: 'inline', shape: 'circle' },
};

export const Labelled: Story = {
  args: { size: 'sm', shape: 'circle', label: 'Loading tracks' },
};

/** Pixel size for icon slots such as the 28px player play button. */
export const PixelSize: Story = {
  args: { size: 28, shape: 'circle' },
};

/** `InlineLoader`: spinner plus text for a panel or list that is still
 * loading; announced as a status. */
export const InlineText: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <InlineLoader label="Loading the board…" />
      <InlineLoader label="Loading…" textSize="xs" />
    </div>
  ),
};
