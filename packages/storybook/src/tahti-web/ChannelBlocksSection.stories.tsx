import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelBlocksSection } from '@tahti-web/components/disco-widgets/ChannelBlocksSection';
import { expect, within } from 'storybook/test';

const addon = (id: string, name: string) => ({
  installId: `install-${id}`,
  widgetSlug: id,
  name,
  sandboxUrl: 'about:blank',
  version: '1.0.0',
  position: 0,
  config: {},
  context: { channelSlug: 'northern-lights' },
});

const meta: Meta<typeof ChannelBlocksSection> = {
  title: 'Tahti/Widgets/ChannelBlocksSection',
  component: ChannelBlocksSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The channel layout from `/api/v1/channels/:slug/blocks`: logo and add-on blocks in rows of Full, Half and Third widths, packed like the legacy dashboard. Narrow columns stack every block. Artists set widths in the add-on manager (Studio add-ons). Add-on iframes point at a placeholder here, so they render blank. Missing states: no editor for logo blocks yet.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedWidths: Story = {
  args: {
    blocks: [
      {
        id: 'logo',
        type: 'LOGO',
        width: 'FULL',
        position: 0,
        logoUrl: 'https://picsum.photos/seed/tahti-logo/900/300',
        addon: null,
      },
      {
        id: 'a',
        type: 'ADDON',
        width: 'HALF',
        position: 1,
        logoUrl: null,
        addon: addon('a', 'Live status'),
      },
      {
        id: 'b',
        type: 'ADDON',
        width: 'HALF',
        position: 2,
        logoUrl: null,
        addon: addon('b', 'Upcoming shows'),
      },
      {
        id: 'c',
        type: 'ADDON',
        width: 'THIRD',
        position: 3,
        logoUrl: null,
        addon: addon('c', 'Merch'),
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByTestId('channel-block-row')).toHaveLength(3);
  },
};

export const Empty: Story = {
  args: { blocks: [] },
};
