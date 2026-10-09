import type { Meta, StoryObj } from '@storybook/react-vite';
import { AdminTestNotificationPanel } from '@tahti-web/views/admin/AdminTestNotificationPanel';
import { expect, userEvent, within } from 'storybook/test';

import { withToaster } from './_fixtures/track-release';
import { findToast } from './_lib/play';

const meta: Meta<typeof AdminTestNotificationPanel> = {
  title: 'Tahti/Admin/AdminTestNotificationPanel',
  component: AdminTestNotificationPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Admin → News: sends one notification to a single member to preview how it looks.',
      },
    },
  },
  decorators: [withToaster()],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Send stays disabled until a username and title are filled in. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole('heading', { name: 'Send a test notification' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Send test' }),
    ).toBeDisabled();
  },
};

/** A leading @ is stripped from the username in the confirmation. */
export const Sent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Username' }),
      '@listener-liina',
    );
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Title' }),
      'New release out now',
    );
    const send = canvas.getByRole('button', { name: 'Send test' });
    await expect(send).toBeEnabled();
    await userEvent.click(send);
    await findToast(
      canvasElement,
      'Test notification sent to @listener-liina.',
    );
    await expect(canvas.getByRole('textbox', { name: 'Title' })).toHaveValue(
      '',
    );
  },
};
