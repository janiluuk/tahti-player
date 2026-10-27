import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChangeEmailForm } from '@tahti-web/components/ChangeEmailForm';
import { ChangePasswordForm } from '@tahti-web/components/ChangePasswordForm';
import { expect, userEvent, within } from 'storybook/test';

/** Settings → Account → Password & email. Under `VITE_FORCE_MOCK` both
 * requests succeed, and a sent email-change link shows as pending. */
function PasswordEmailSettings() {
  return (
    <div className="flex flex-col gap-8">
      <ChangePasswordForm />
      <ChangeEmailForm currentEmail="demo@tahti.live" />
    </div>
  );
}

const meta: Meta<typeof PasswordEmailSettings> = {
  title: 'Tahti/Misc/PasswordEmailSettings',
  component: PasswordEmailSettings,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The password rules are checked as you type. */
export const PasswordRules: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Current password'), 'old-one');
    await userEvent.type(canvas.getByLabelText('New password'), 'lowercase1');
    await expect(canvas.getByText('Add an uppercase letter.')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Change password' }),
    ).toBeDisabled();
  },
};

/** Sending an email-change link shows it as waiting, with Cancel. */
export const EmailChangePending: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('New email'), 'new@tahti.live');
    await userEvent.type(canvas.getByLabelText('Password'), 'secret');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Send confirmation link' }),
    );
    await expect(
      await canvas.findByText(/Waiting for confirmation at new@tahti.live/),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Cancel change' }),
    );
    await expect(canvas.queryByText(/Waiting for confirmation/)).toBeNull();
  },
};
