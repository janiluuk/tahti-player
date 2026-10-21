import type { Meta, StoryObj } from '@storybook/react-vite';
import { clearMockSessionUser } from '@tahti-web/api/mock-session';
import { useAuthStore } from '@tahti-web/stores/authStore';
import { SetupPasswordView } from '@tahti-web/views/SetupPasswordView';
import { expect, userEvent, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { withLocationSearch } from './_lib/location';
import { mockData } from './_lib/mock-data';

const meta: Meta<typeof SetupPasswordView> = {
  title: 'Tahti/Auth/SetupPasswordView',
  component: SetupPasswordView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/setup-password?token=`: one-time invite link that lets a passwordless account (board-invited or imported) set its first password.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/setup-password'),
    withMockAuth(null),
    withPageSurface(),
  ],
  beforeEach: withLocationSearch('?token=mock-invite-token'),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** A valid invite welcomes the account and checks the password as typed. */
export const ValidInvite: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Set your password' }),
    ).toBeVisible();
    await expect(
      await canvas.findByText(
        'Welcome, New Artist — finish setting up newartist@tahti.live.',
      ),
    ).toBeVisible();
    const submit = canvas.getByRole('button', { name: 'Set password' });
    await expect(submit).toBeDisabled();

    await userEvent.type(canvas.getByLabelText('Password'), 'short');
    await expect(
      canvas.getByText('Password must be at least 8 characters.'),
    ).toBeVisible();
    await userEvent.type(canvas.getByLabelText('Password'), '-enough');
    await userEvent.type(canvas.getByLabelText('Confirm password'), 'other');
    await expect(canvas.getByText("Passwords don't match.")).toBeVisible();
    await expect(submit).toBeDisabled();
  },
};

/** Setting a matching password signs the user in. */
export const PasswordSet: Story = {
  beforeEach: () => () => {
    clearMockSessionUser();
    useAuthStore.setState({ user: null });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText(/Welcome, New Artist/);
    await userEvent.type(canvas.getByLabelText('Password'), 'first-secret');
    await userEvent.type(
      canvas.getByLabelText('Confirm password'),
      'first-secret',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Set password' }));
    await expect(
      await canvas.findByRole('heading', { name: 'Password set' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Signed in — taking you to your dashboard…'),
    ).toBeVisible();
  },
};

/** An expired invite asks for a fresh link. */
export const ExpiredInvite: Story = {
  parameters: {
    mockData: mockData({
      setupPasswordInfo: () => ({
        ok: false,
        error: 'This invite link has expired.',
      }),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('This invite link has expired.'),
    ).toBeVisible();
    await expect(
      canvas.getByText(/Ask whoever invited you for a fresh link/),
    ).toBeVisible();
    await expect(canvas.queryByLabelText('Password')).toBeNull();
  },
};

/** Opened without a token. */
export const MissingToken: Story = {
  beforeEach: withLocationSearch(''),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Missing setup link token.'),
    ).toBeVisible();
  },
};
