import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerifyView } from '@tahti-web/views/VerifyView';
import { expect, userEvent, within } from 'storybook/test';

import {
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { withLocationSearch } from './_lib/location';

const meta: Meta<typeof VerifyView> = {
  title: 'Tahti/Auth/VerifyView',
  component: VerifyView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/verify?token=`: verifies the signup email straight from the link, or from a pasted token.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    withTahtiRouter('/verify'),
    withMockAuth(null),
    withPageSurface(),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Opened from the email link: verifies on load. */
export const FromEmailLink: Story = {
  beforeEach: withLocationSearch('?token=mock-verify-token'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole('heading', { name: 'Email verified' }),
    ).toBeVisible();
    await expect(canvas.getByText('Mock verify OK')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Continue to login' }),
    ).toBeVisible();
  },
};

/** No token in the URL: paste one and verify. */
export const PasteToken: Story = {
  beforeEach: withLocationSearch(''),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Verify email' }),
    ).toBeVisible();
    const verify = canvas.getByRole('button', { name: 'Verify email' });
    await expect(verify).toBeDisabled();
    await userEvent.type(
      canvas.getByLabelText('Verification token'),
      'pasted-token',
    );
    await userEvent.click(verify);
    await expect(
      await canvas.findByRole('heading', { name: 'Email verified' }),
    ).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Join' })).toHaveAttribute(
      'href',
      '/join',
    );
  },
};
