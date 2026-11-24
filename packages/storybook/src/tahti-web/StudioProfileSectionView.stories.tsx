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
          '`/studio/profile/$section`: one Studio → Profile tab, reached from the Profile sub-tab row (Identity · Links · Link page · Branding · Gallery & press kit) that StudioNav draws under the Studio tabs. Identity holds the basics, story and people with one Save; Branding includes the release visual defaults; Gallery & press kit share a page. The title hides on phones, where the sub-tab row already names the page. Old `/studio/profile/story`, `people`, `release-visuals` and `press-kit` addresses land on the merged tab at the matching anchor; channel pages moved to Studio → Channel.',
      },
    },
  },
  decorators: [withPageSurface(), withToaster()],
};

export default meta;
type Story = StoryObj<typeof meta>;

async function expectPage(canvasElement: HTMLElement, heading: string) {
  const canvas = within(canvasElement);
  await expect(
    await canvas.findByRole('heading', { level: 1, name: heading }),
  ).toBeInTheDocument();
  await expect(canvas.queryByTestId('page-back-link')).toBeNull();
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
    await expectVisible(canvas.getByRole('heading', { name: 'Basics' }));
    await expectVisible(canvas.getByRole('heading', { name: 'Story' }));
    await expectVisible(canvas.getByRole('heading', { name: 'People' }));
    await expect(
      canvas
        .getAllByRole('button', { name: /^Save/ })
        .map((b) => b.textContent),
    ).toEqual(['Save identity']);
    await expectVisible(
      await canvas.findByTestId('studio-profile-live-preview'),
    );
    await expect(
      canvas.getByRole('button', { name: 'About Nameplate' }),
    ).toBeInTheDocument();
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

export const LinkPage: Story = {
  args: { section: 'link-page' },
  decorators: [
    withTahtiRouter('/studio/profile/link-page'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Link page');
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Your link page' }),
    );
    await expectVisible(
      canvas.getByRole('radio', { name: /Play on the link page/ }),
    );
    await expect(
      canvas.queryByRole('button', { name: 'Statistics' }),
    ).toBeNull();
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
    await expect(
      canvas.getByRole('heading', { name: 'Release visuals' }),
    ).toBeInTheDocument();
  },
};

export const GalleryAndPressKit: Story = {
  args: { section: 'gallery' },
  decorators: [
    withTahtiRouter('/studio/profile/gallery'),
    withMockAuth(MOCK_USERS.artist),
  ],
  play: async ({ canvasElement }) => {
    const canvas = await expectPage(canvasElement, 'Gallery & press kit');
    await expect(
      await canvas.findByTestId('studio-profile-section-gallery'),
    ).toBeInTheDocument();
    await expect(canvasElement.querySelector('#press-kit')).not.toBeNull();
  },
};
