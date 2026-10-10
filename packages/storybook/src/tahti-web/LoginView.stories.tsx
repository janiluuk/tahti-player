import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { AuthDialog } from '@tahti-web/components/AuthDialog';
import { useAuthModalStore } from '@tahti-web/stores/authModalStore';
import { JoinView } from '@tahti-web/views/JoinView';
import { LoginView } from '@tahti-web/views/LoginView';
import { expect } from 'storybook/test';

import { withMockAuth, withTahtiRouter } from './_lib/decorators';
import { findDialog } from './_lib/play';

/** The deep links only open the app-wide AuthDialog, which AppShell mounts. */
const withClosedAuthModal: Decorator = (Story) => {
  useAuthModalStore.setState({ isOpen: false, mode: 'login' });
  return (
    <>
      <Story />
      <AuthDialog />
    </>
  );
};

const meta: Meta<typeof LoginView> = {
  title: 'Tahti/Auth/LoginView',
  component: LoginView,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '`/login` and `/join` have no page of their own: they open the auth dialog in the chosen mode and replace the URL with `/`.',
      },
    },
  },
  decorators: [withMockAuth(null)],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** `/login` opens the dialog on the sign-in form. */
export const Login: Story = {
  decorators: [withClosedAuthModal, withTahtiRouter('/login')],
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, /Log in/);
    await expect(dialog.getByRole('button', { name: 'Sign in' })).toBeVisible();
  },
};

/** `/join` opens the dialog on the join form. */
export const Join: Story = {
  decorators: [withClosedAuthModal, withTahtiRouter('/join')],
  render: () => <JoinView />,
  play: async ({ canvasElement }) => {
    const dialog = await findDialog(canvasElement, /Join/);
    await expect(
      dialog.getByRole('button', { name: 'Create account' }),
    ).toBeVisible();
  },
};
