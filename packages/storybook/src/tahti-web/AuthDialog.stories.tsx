import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { AuthDialog } from '@tahti-web/components/AuthDialog';
import { useAuthModalStore } from '@tahti-web/stores/authModalStore';
import { useAuthStore } from '@tahti-web/stores/authStore';
import { expect, userEvent, waitFor } from 'storybook/test';

import { withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

/** Seeds the auth modal store to a given open/mode state before render —
 * mirrors withMockAuth's pattern, but for the modal-visibility store this
 * component reads instead of the auth store. */
function withAuthModal(
  mode: 'login' | 'join' = 'login',
  totpChallengeId: string | null = null,
): Decorator {
  return (Story) => {
    useAuthStore.setState({
      user: null,
      hydrated: true,
      loading: false,
      error: null,
      totpChallengeId,
    });
    useAuthModalStore.setState({ isOpen: true, mode });
    return <Story />;
  };
}

const meta: Meta<typeof AuthDialog> = {
  title: 'Tahti/Auth/AuthDialog',
  component: AuthDialog,
  parameters: { layout: 'centered' },
  decorators: [withTahtiRouter('/')],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Sign in waits for both fields; "Join" switches to the join form. */
export const Login: Story = {
  decorators: [withAuthModal('login')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, /Log in/);
    await expect(
      dialog.getByText('Sign in to unlock your library, studio, and chat.'),
    ).toBeVisible();
    await expect(
      dialog.getByRole('link', { name: 'Forgot password?' }),
    ).toHaveAttribute('href', '/forgot-password');
    const signIn = dialog.getByRole('button', { name: 'Sign in' });
    await expect(signIn).toBeDisabled();
    await userEvent.type(dialog.getByLabelText('Email'), 'liina@example.com');
    await expect(signIn).toBeDisabled();
    await userEvent.type(dialog.getByLabelText('Password'), 'secret-pass');
    await expect(signIn).toBeEnabled();

    await userEvent.click(dialog.getByRole('button', { name: 'Join' }));
    const join = await findDialog(canvasElement, /Join/);
    await expect(
      join.getByRole('button', { name: 'Create account' }),
    ).toBeVisible();
  },
};

/** Join checks the passwords and the account type changes the name label. */
export const Join: Story = {
  decorators: [withAuthModal('join')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, /Join/);
    await expect(
      dialog.getByText('Create an account, then verify your email.'),
    ).toBeVisible();
    const create = dialog.getByRole('button', { name: 'Create account' });
    await expect(create).toBeDisabled();

    await expect(dialog.getByLabelText('Artist name')).toBeVisible();
    await userEvent.click(
      dialog.getByRole('radio', { name: 'Band / Collective' }),
    );
    await expect(dialog.getByLabelText('Collective name')).toBeVisible();

    await userEvent.type(dialog.getByLabelText('Email'), 'band@example.com');
    await userEvent.type(
      dialog.getByLabelText('Collective name'),
      'Aurora Unit',
    );
    await userEvent.type(dialog.getByLabelText('Password'), 'secret-pass');
    await userEvent.type(dialog.getByLabelText('Confirm password'), 'other');
    await expect(dialog.getByText('Passwords do not match.')).toBeVisible();
    await expect(create).toBeDisabled();

    await userEvent.clear(dialog.getByLabelText('Confirm password'));
    await userEvent.type(
      dialog.getByLabelText('Confirm password'),
      'secret-pass',
    );
    await waitFor(() => expect(create).toBeEnabled());
  },
};

/** A wrong 6-digit code shows the error and keeps the dialog open. */
export const TwoFactorChallenge: Story = {
  decorators: [withAuthModal('login', 'challenge-mock-1')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, /Two-factor code/);
    const verify = dialog.getByRole('button', { name: 'Verify' });
    await expect(verify).toBeDisabled();
    await userEvent.type(
      dialog.getByLabelText('Authentication code'),
      '999999',
    );
    await expect(verify).toBeEnabled();
    await userEvent.click(verify);
    await expect(await dialog.findByText('Invalid code.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Back' })).toBeVisible();
  },
};
