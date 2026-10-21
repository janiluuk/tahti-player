import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForgotPasswordView } from '@tahti-web/views/ForgotPasswordView';
import { expect, userEvent, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';

const meta: Meta<typeof ForgotPasswordView> = {
  title: 'Tahti/Auth/ForgotPasswordView',
  component: ForgotPasswordView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/forgot-password`: asks for the account email and always answers with the same message, so the page cannot be used to find out which emails have accounts.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/forgot-password'),
    withMockAuth(null),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Empty form: the send button waits for an email. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Reset your password' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: '← Login' })).toHaveAttribute(
      'href',
      '/login',
    );
    await expect(
      canvas.getByRole('button', { name: 'Send reset link' }),
    ).toBeDisabled();
  },
};

/** Sending the link shows the generic confirmation. */
export const LinkSent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Email'), 'someone@example.com');
    const send = canvas.getByRole('button', { name: 'Send reset link' });
    await expect(send).toBeEnabled();
    await userEvent.click(send);
    await expect(
      await canvas.findByText(
        'If an account exists for that email, we sent a link to reset your password.',
      ),
    ).toBeVisible();
  },
};
