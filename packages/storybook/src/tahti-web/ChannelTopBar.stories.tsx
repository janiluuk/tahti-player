import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelTopBar } from '@tahti-web/components/channel-view';
import { expect, within } from 'storybook/test';

const meta: Meta<typeof ChannelTopBar> = {
  title: 'Tahti/Channel/ChannelTopBar',
  component: ChannelTopBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The artist's top bar line from the Channel Designer, shown above pages without a hero block. Blank text renders nothing.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithText: Story = {
  args: { text: '  New EP out Friday - pre-save now  ' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByTestId('channel-top-bar'),
    ).toHaveTextContent(/^New EP out Friday - pre-save now$/);
  },
};

export const Blank: Story = {
  args: { text: '   ' },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).queryByTestId('channel-top-bar'),
    ).toBeNull();
  },
};
