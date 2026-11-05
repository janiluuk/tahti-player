import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelFeatureSettings } from '@tahti-web/components/channel-view/ChannelFeatureSettings';
import {
  defaultChannelPageLayout,
  type ChannelPageItem,
} from '@tahti-web/lib/channelPageLayout';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { withinBody } from './_lib/play';

const meta: Meta<typeof ChannelFeatureSettings> = {
  title: 'Tahti/Channel/Designer/ChannelFeatureSettings',
  component: ChannelFeatureSettings,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The channel header's **Settings** while editing: the one place header details (avatar, bio, Subscribe, follower and play counts) and page sections are turned on and off. Features that are off stay faded on the page while editing.",
      },
    },
  },
  args: { layout: defaultChannelPageLayout(), updateLayout: fn() },
  render: (args) => {
    const [layout, setLayout] = useState<ChannelPageItem[]>(args.layout);
    return (
      <ChannelFeatureSettings
        {...args}
        layout={layout}
        updateLayout={(updater) => {
          args.updateLayout(updater);
          setLayout((prev) => updater(prev));
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TurnFeaturesOnAndOff: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = withinBody(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Settings' }));
    const counts = await body.findByRole('switch', {
      name: 'Follower and play counts',
    });
    await expect(counts).toBeChecked();
    await userEvent.click(counts);
    await expect(args.updateLayout).toHaveBeenCalledOnce();
    const spy = args.updateLayout as unknown as ReturnType<typeof fn>;
    const updater = spy.mock.calls[0]![0] as (
      prev: ChannelPageItem[],
    ) => ChannelPageItem[];
    await expect(
      updater(args.layout).find((item) => item.type === 'headerStats')?.visible,
    ).toBe(false);
    await userEvent.click(body.getByRole('switch', { name: 'Live shows' }));
    await expect(args.updateLayout).toHaveBeenCalledTimes(2);
  },
};

export const RadioChannel: Story = {
  args: { isRadioChannel: true },
  play: async ({ canvasElement }) => {
    const body = withinBody(canvasElement);
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Settings' }),
    );
    await expect(
      await body.findByRole('switch', { name: 'Programming' }),
    ).toBeInTheDocument();
    await expect(
      body.queryByRole('switch', { name: 'Subscribe button' }),
    ).toBeNull();
  },
};
