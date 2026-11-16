import type { Meta, StoryObj } from '@storybook/react-vite';
import { StudioProfileSectionView } from '@tahti-web/views/studio/StudioProfileSectionView';
import { expect, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof StudioProfileSectionView> = {
  title: 'Tahti/Studio/StudioProfileSectionView',
  component: StudioProfileSectionView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/studio/profile/$section`: one Studio → Profile form on its own page, with a back link to the Profile hub, the hub card title as the heading and no tab rows. Artist forms (identity, story, people, links, branding, gallery, press kit, release visuals) and channel forms (channel design, how fans find you, address and domain). `/settings/artist?tab=…` for an artist, `/settings/channel?tab=…` and `/studio/branding?tab=…` land here.',
      },
    },
  },
  decorators: [withPageSurface(), withToaster()],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectPage(canvasElement: HTMLElement, heading: string) {
  const canvas = within(canvasElement);
  await expectVisible(
    await canvas.findByRole('heading', { level: 1, name: heading }),
  );
  await expect(canvas.getByTestId('page-back-link')).toHaveAttribute(
    'href',
    '/studio/profile',
  );
  await expect(canvas.queryByRole('tablist')).toBeNull();
  return canvas;
}

export const Identity: Story = {
  args: { section: 'identity' },
  decorators: [
    withTahtiRouter('/studio/profile/identity'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Identity');
    await expectVisible(
      await canvas.findByRole('textbox', { name: 'Display name' }),
    );
    await expectVisible(canvas.getByRole('button', { name: 'Save identity' }));
  },
};

export const Links: Story = {
  args: { section: 'connections' },
  decorators: [
    withTahtiRouter('/studio/profile/connections'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Links');
    await expectVisible(
      await canvas.findByRole('button', { name: 'Save social links' }),
    );
  },
};

export const Branding: Story = {
  args: { section: 'branding' },
  decorators: [
    withTahtiRouter('/studio/profile/branding'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Branding');
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Profile picture' }),
    );
    await expectVisible(canvas.getByRole('heading', { name: 'Logo' }));
  },
};

export const ChannelDesign: Story = {
  args: { section: 'appearance' },
  decorators: [
    withTahtiRouter('/studio/profile/appearance'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Channel design');
    await expect(
      await canvas.findByTestId('channel-designer-programme-link'),
    ).toHaveAttribute('href', '/studio/schedule#channel-programme');
  },
};

export const HowFansFindYou: Story = {
  args: { section: 'discovery' },
  decorators: [
    withTahtiRouter('/studio/profile/discovery'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'How fans find you');
    await expectVisible(
      await canvas.findByRole('switch', {
        name: 'Show share button on my channel',
      }),
    );
  },
};

export const AddressAndDomain: Story = {
  args: { section: 'domain' },
  decorators: [
    withTahtiRouter('/studio/profile/domain'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Address and domain');
    await expectVisible(
      await canvas.findByRole('textbox', { name: 'Channel slug / username' }),
    );
  },
};
