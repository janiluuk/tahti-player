import type { Meta, StoryObj } from '@storybook/react-vite';
import { IdentityToggles } from '@tahti-web/components/channel-designer/IdentityToggles';
import type { ChannelPageItem } from '@tahti-web/lib/channelPageLayout';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import { designLayout } from './_fixtures/channel-design';

/** Backdrop panel avatar / bio / Subscribe switches. Only shown when the
 * designer is nested in ChannelView's editor, which owns the page layout. */
const meta: Meta<typeof IdentityToggles> = {
  title: 'Tahti/Channel/Designer/IdentityToggles',
  component: IdentityToggles,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: { layout: designLayout(), onLayoutChange: fn() },
  render: function Render(args) {
    const [layout, setLayout] = useState<ChannelPageItem[]>(args.layout);
    return (
      <div className="max-w-sm">
        <IdentityToggles
          layout={layout}
          onLayoutChange={(updater) => {
            setLayout(updater);
            args.onLayoutChange(updater);
          }}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByRole('switch', { name: 'Show avatar' });
    const bio = canvas.getByRole('switch', { name: 'Show bio' });
    const subscribe = canvas.getByRole('switch', {
      name: 'Show Subscribe button',
    });
    await expect(avatar).toBeChecked();
    await expect(bio).toBeChecked();
    await expect(subscribe).not.toBeChecked();

    await userEvent.click(subscribe);
    await expect(subscribe).toBeChecked();
    await userEvent.click(bio);
    await expect(bio).not.toBeChecked();
    await expect(args.onLayoutChange).toHaveBeenCalledTimes(2);
  },
};

export const AllHidden: Story = {
  name: 'Everything hidden',
  args: {
    layout: designLayout().map((item) =>
      ['avatar', 'about', 'subscribe'].includes(item.type)
        ? { ...item, visible: false }
        : item,
    ),
  },
};
