import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import type { ProfileFields } from '@tahti-web/api/studio-extras';
import { ProfileIdentityHeader } from '@tahti-web/views/studio/branding/ProfileIdentityHeader';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { MOCK_USERS, withMockAuth, withTahtiRouter } from './_lib/decorators';

const emptyProfile = {
  id: 'artist-1',
  username: 'northern-lights',
  displayName: 'Northern Lights',
  avatarUrl: null,
  avatarTheme: null,
  backdropUrl: null,
} as unknown as ProfileFields;

const filledProfile = {
  ...emptyProfile,
  avatarUrl: 'https://picsum.photos/seed/tahti-northern-lights/256',
  backdropUrl: 'https://picsum.photos/seed/tahti-slide-1/1200/300',
} as ProfileFields;

function Header({ initial }: { initial: ProfileFields }) {
  const [profile, setProfile] = useState<ProfileFields | null>(initial);
  return profile ? (
    <ProfileIdentityHeader profile={profile} setProfile={setProfile} />
  ) : null;
}

const meta = {
  title: 'Tahti/Studio/Profile/ProfileIdentityHeader',
  component: Header,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Top of Studio → Profile → Identity: the profile backdrop as a banner with the profile picture overlapping its lower edge. Each shows a pencil on hover or keyboard focus (always on touch) and opens its change dialog: backdrop upload/replace/remove, or the picture picker (upload, presets, own images, image link, remove, avatar colour when there is no picture). Empty states show an "Add a backdrop" surface and the default artwork.',
      },
    },
  },
  decorators: [
    withToaster(),
    withTahtiRouter('/studio/profile/identity'),
    withMockAuth(MOCK_USERS.artist),
  ],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectEditButtons(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const backdrop = canvas.getByTestId('profile-identity-backdrop');
  const avatar = canvas.getByTestId('profile-identity-avatar');
  await expect(
    within(backdrop).getByRole('button', { name: 'Change backdrop' }),
  ).toBeInTheDocument();
  await expect(
    within(avatar).getByRole('button', { name: 'Change profile picture' }),
  ).toBeInTheDocument();
  const banner = backdrop.getBoundingClientRect();
  const circle = avatar.getBoundingClientRect();
  await expect(circle.top).toBeLessThan(banner.bottom);
  await expect(circle.bottom).toBeGreaterThan(banner.bottom);
  return canvas;
}

export const Empty: Story = {
  args: { initial: emptyProfile },
  play: async ({ canvasElement }) => {
    const canvas = await expectEditButtons(canvasElement);
    await expect(canvas.getByText('Add a backdrop')).toBeVisible();
    await expect(
      within(canvas.getByTestId('profile-identity-avatar')).getByRole('img'),
    ).toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Change profile picture' }),
    );
    const body = within(document.body);
    await waitFor(() =>
      expect(body.getByTestId('cover-art-picker')).toBeVisible(),
    );
    await expect(body.getByLabelText('Image URL')).toBeVisible();
    await expect(
      body.getByRole('button', { name: 'Avatar colour 1' }),
    ).toBeVisible();
  },
};

export const Filled: Story = {
  args: { initial: filledProfile },
  play: async ({ canvasElement }) => {
    const canvas = await expectEditButtons(canvasElement);
    await expect(canvas.queryByText('Add a backdrop')).toBeNull();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Change backdrop' }),
    );
    const body = within(document.body);
    const dialog = await body.findByRole('dialog');
    await expect(within(dialog).getByTestId('profile-backdrop')).toBeVisible();
    await expect(
      within(dialog).getByRole('button', { name: 'Remove backdrop' }),
    ).toBeVisible();
  },
};

export const FilledPicturePicker: Story = {
  name: 'Filled - picture picker',
  args: { initial: filledProfile },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change profile picture' }),
    );
    const body = within(document.body);
    await waitFor(() =>
      expect(body.getByTestId('cover-art-picker')).toBeVisible(),
    );
    await expect(body.getByTestId('avatar-theme-hint')).toBeVisible();
    await expect(
      body.getByRole('button', { name: 'Remove profile picture' }),
    ).toBeVisible();
    await expect(
      body.queryByRole('button', { name: 'Avatar colour 1' }),
    ).toBeNull();
  },
};

async function expectFitsPhone(canvasElement: HTMLElement) {
  const canvas = await expectEditButtons(canvasElement);
  const header = canvas.getByTestId('profile-identity-header');
  await expect(header.getBoundingClientRect().width).toBeLessThanOrEqual(390);
  await expect(header.scrollWidth).toBeLessThanOrEqual(header.clientWidth + 1);
}

const phoneFrame: Decorator = (Story) => (
  <div className="w-[390px] max-w-full overflow-hidden">
    <Story />
  </div>
);

const phone = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [phoneFrame],
};

export const EmptyPhone: Story = {
  ...phone,
  name: 'Empty at 390 px',
  args: { initial: emptyProfile },
  play: async ({ canvasElement }) => expectFitsPhone(canvasElement),
};

export const FilledPhone: Story = {
  ...phone,
  name: 'Filled at 390 px',
  args: { initial: filledProfile },
  play: async ({ canvasElement }) => expectFitsPhone(canvasElement),
};
