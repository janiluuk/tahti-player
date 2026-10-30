import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfilePictureSection } from '@tahti-web/views/studio/branding/ProfilePictureSection';
import type { PressKitState } from '@tahti-web/views/studio/branding/usePressKit';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';

function kit(avatarUrl: string | null): PressKitState {
  return {
    avatarUrl,
    handleAvatarChange: fn(),
    profile: { avatarTheme: null },
    setProfile: fn(),
  } as unknown as PressKitState;
}

const meta = {
  title: 'Tahti/Studio/Branding/ProfilePictureSection',
  component: ProfilePictureSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Settings → Artist → Branding profile picture. Clicking the avatar opens the picker (upload, gallery, image link). Avatar colours only show when there is no picture, since a picture covers them.',
      },
    },
  },
  decorators: [
    withTahtiRouter('/settings/artist'),
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProfilePictureSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No picture: avatar colour swatches are offered; the image link box is in
 * the dialog behind the avatar, not inline. */
export const NoPicture: Story = {
  args: { kit: kit(null) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('button', { name: 'Avatar colour 1' }),
    ).toBeVisible();
    await expect(canvas.queryByLabelText('Image URL')).toBeNull();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Change profile picture' }),
    );
    const body = within(document.body);
    await waitFor(() =>
      expect(body.getByTestId('cover-art-picker')).toBeVisible(),
    );
    await expect(body.getByLabelText('Image URL')).toBeVisible();
  },
};

/** With a picture the colour swatches are hidden and a hint says why. */
export const WithPicture: Story = {
  args: { kit: kit('https://picsum.photos/seed/tahti-avatar/400/400') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.queryByRole('button', { name: 'Avatar colour 1' }),
    ).toBeNull();
    await expect(canvas.getByTestId('avatar-theme-hint')).toBeVisible();
  },
};
