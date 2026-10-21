import { StoryObj } from '@storybook/react-vite';

import { Loader } from '@tahti-player/ui';

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
