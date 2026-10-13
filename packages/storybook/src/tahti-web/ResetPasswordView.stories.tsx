import type { Meta, StoryObj } from '@storybook/react-vite';
import { clearMockSessionUser } from '@tahti-web/api/mock-session';
import { useAuthStore } from '@tahti-web/stores/authStore';
import { ResetPasswordView } from '@tahti-web/views/ResetPasswordView';
import { expect, userEvent, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { withLocationSearch } from './_lib/location';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof ResetPasswordView> = {
  title: 'Tahti/Auth/ResetPasswordView',
  component: ResetPasswordView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/reset-password?token=`: resolves the account behind the emailed link, then lets the user choose a new password and signs them in.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/reset-password'),
    withMockAuth(null),
    withPageSurface(),
  ],
  beforeEach: withLocationSearch('?token=mock-reset-token'),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A valid link greets the account and checks the new password as typed. */
export const ValidLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Choose a new password' }),
    ).toBeVisible();
    await expect(
      await canvas.findByText(
        'Hi New Artist, set a new password for newartist@tahti.live.',
      ),
    ).toBeVisible();
    const submit = canvas.getByRole('button', {
      name: 'Reset password & sign in',
    });
    await expect(submit).toBeDisabled();

    await userEvent.type(canvas.getByLabelText('New password'), 'short');
    await expect(
      canvas.getByText('Password must be at least 8 characters.'),
    ).toBeVisible();

    await userEvent.type(canvas.getByLabelText('New password'), '-enough');
    await userEvent.type(
      canvas.getByLabelText('Confirm new password'),
      'different',
    );
    await expect(canvas.getByText("Passwords don't match.")).toBeVisible();
    await expect(submit).toBeDisabled();

    await userEvent.clear(canvas.getByLabelText('Confirm new password'));
    await userEvent.type(
      canvas.getByLabelText('Confirm new password'),
      'short-enough',
    );
    await expect(canvas.queryByText("Passwords don't match.")).toBeNull();
    await expect(submit).toBeEnabled();
  },
};

/** Submitting a matching password signs the user in. */
export const PasswordReset: Story = {
  beforeEach: () => () => {
    clearMockSessionUser();
    useAuthStore.setState({ user: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Hi New Artist/);
    await userEvent.type(canvas.getByLabelText('New password'), 'new-secret-1');
    await userEvent.type(
      canvas.getByLabelText('Confirm new password'),
      'new-secret-1',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Reset password & sign in' }),
    );
    await expect(
      await canvas.findByRole('heading', { name: 'Password reset' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Signed in — taking you to your dashboard…'),
    ).toBeVisible();
  },
};

/** An expired or used link explains how to get a new one. */
export const ExpiredLink: Story = {
  parameters: {
    mockData: mockData({
      resetPasswordInfo: () => ({
        ok: false,
        error: 'This reset link has expired.',
      }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('This reset link has expired.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'password reset page' }),
    ).toHaveAttribute('href', '/forgot-password');
    await expect(canvas.queryByLabelText('New password')).toBeNull();
  },
};

/** Opened without a token. */
export const MissingToken: Story = {
  beforeEach: withLocationSearch(''),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Missing reset link token.'),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'log in' })).toHaveAttribute(
      'href',
      '/login',
    );
  },
};
