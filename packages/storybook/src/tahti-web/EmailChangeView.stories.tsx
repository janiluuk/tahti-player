import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmailChangeView } from '@tahti-web/views/EmailChangeView';
import { expect, within } from 'storybook/test';

import {
  MOCK_USERS,
  withMockAuth,
  withPageSurface,
  withTahtiRouter,
} from './_lib/decorators';
import { withLocationSearch } from './_lib/location';
import { expectVisible } from './_lib/play';

const meta: Meta<typeof EmailChangeView> = {
  title: 'Tahti/Auth/EmailChangeView',
  component: EmailChangeView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '`/email-change?token=`: opened from the link sent to a new account address. Confirms the change on load, signed in or not, then links back to Settings → Account (signed in) or to sign-in. Without a token it explains the link is broken and that links expire.',
      },
    },
  },
  decorators: [withTahtiRouter('/email-change'), withPageSurface()],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmedSignedOut: Story = {
  beforeEach: withLocationSearch('?token=mock-email-change-token'),
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Email changed' }),
    );
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Your account now uses the new address.',
    );
    await expect(canvas.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  },
};

export const ConfirmedSignedIn: Story = {
  beforeEach: withLocationSearch('?token=mock-email-change-token'),
  decorators: [withMockAuth(MOCK_USERS.listener)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByRole('heading', { name: 'Email changed' }),
    );
    await expect(
      canvas.getByRole('link', { name: 'Back to Settings' }),
    ).toHaveAttribute('href', '/settings/account');
  },
};

export const MissingToken: Story = {
  beforeEach: withLocationSearch(''),
  decorators: [withMockAuth(null)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectVisible(
      await canvas.findByText(
        'This link has no token. Open the link from the email again.',
      ),
    );
    await expect(
      canvas.getByRole('heading', { name: 'Confirm new email' }),
    ).toBeVisible();
    await expect(
      canvas.getByText(
        'Links work once and expire after 24 hours. Ask for a new one in Settings → Security.',
      ),
    ).toBeVisible();
    await expect(canvas.queryByRole('link')).toBeNull();
  },
};
