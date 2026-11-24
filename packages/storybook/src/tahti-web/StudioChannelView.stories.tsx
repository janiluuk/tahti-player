import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioChannelView } from '@tahti-web/views/studio/StudioChannelView';
import { expect, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioChannelView> = {
  title: 'Tahti/Studio/StudioChannelView',
  component: StudioChannelView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/studio/channel/$section`: Studio → Channel, its own top-level Studio tab with a sub-tab row (Design · Radio · Visibility · Address) drawn by StudioNav. Radio is the 24/7 stream (Stream · Pinned) with links to the programme on Schedule, stats, chat, the green room and live destinations on Go live. Visibility merges how fans find the channel with what profile visitors see. Bare `/studio/channel` and its old `?tab=` / `?radio=` / `#radio` links redirect to a tab, Schedule or Go live.',
      },
    },
  },
  decorators: [
    withPageSurface(),
    withToaster(),
    withMockAuth(MOCK_USERS.artist),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectPage(canvasElement: HTMLElement, heading: string) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole('heading', { level: 1, name: heading }),
  ).toBeInTheDocument();
  return canvas;
}

export const Design: Story = {
  args: { section: 'design' },
  decorators: [withTahtiRouter('/studio/channel/design')],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Design');
    await expect(
      await canvas.findByTestId('channel-designer-programme-link'),
    ).toHaveAttribute('href', '/studio/schedule#channel-programme');
  },
};

export const Radio: Story = {
  args: { section: 'radio' },
  decorators: [withTahtiRouter('/studio/channel/radio')],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Radio');
    await expect(canvas.getByRole('tab', { name: 'Stream' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(canvas.queryByRole('tab', { name: 'Multicast' })).toBeNull();
    await expect(
      canvas.getByRole('link', { name: 'Live destinations' }),
    ).toHaveAttribute('href', '/studio/go-live?step=destinations');
  },
};

export const Visibility: Story = {
  args: { section: 'visibility' },
  decorators: [withTahtiRouter('/studio/channel/visibility')],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Visibility');
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show share button on my channel',
      }),
    );
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show my followers on my profile',
      }),
    );
  },
};

export const Address: Story = {
  args: { section: 'address' },
  decorators: [withTahtiRouter('/studio/channel/address')],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Address');
    await expectVisible(
      await canvas.findByRole('textbox', { name: 'Channel slug / username' }),
    );
    await expectVisible(canvas.getByRole('textbox', { name: 'Custom domain' }));
    await expect(
      canvas
        .getAllByRole('button')
        .filter((button) => /(^|\s)bg-primary(\s|$)/.test(button.className)),
    ).toHaveLength(0);
  },
};
